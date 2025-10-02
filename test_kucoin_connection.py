#!/usr/bin/env python3
"""
Script para probar la conexión con KuCoin usando las credenciales configuradas.
Ejecutar: python test_kucoin_connection.py
"""

import asyncio
import os
from dotenv import load_dotenv
from exchanges.exchange_factory import ExchangeFactory
from core.utils import load_yaml

async def test_kucoin_connection():
    """Prueba la conexión con KuCoin y muestra información básica"""
    
    # Cargar variables de entorno
    load_dotenv()
    
    # Cargar configuración
    secrets = load_yaml("config/secrets.yaml")
    config = load_yaml("config/config.yaml")
    
    # Obtener credenciales (prioridad: .env > secrets.yaml)
    kucoin_config = {
        "api_key": os.getenv("KUCOIN_API_KEY") or secrets.get("exchanges", {}).get("kucoin", {}).get("api_key"),
        "api_secret": os.getenv("KUCOIN_API_SECRET") or secrets.get("exchanges", {}).get("kucoin", {}).get("api_secret"),
        "passphrase": os.getenv("KUCOIN_PASSPHRASE") or secrets.get("exchanges", {}).get("kucoin", {}).get("passphrase"),
        "api_timeout": 30,
        "rate_limit": 600,
        "default_type": "future",
        "hedge_mode": False,
        "testnet": False
    }
    
    print("🚀 Probando conexión con KuCoin...")
    print(f"📋 API Key: {kucoin_config['api_key'][:8]}...{kucoin_config['api_key'][-4:]}")
    print(f"🔑 Passphrase: {kucoin_config['passphrase']}")
    print("-" * 50)
    
    try:
        # Crear wrapper de exchange
        exchange = ExchangeFactory.create_exchange("kucoin", kucoin_config)
        
        # Probar conexión
        print("🔌 Conectando a KuCoin...")
        connected = await exchange.connect()
        
        if not connected:
            print("❌ Error: No se pudo conectar a KuCoin")
            return False
            
        print("✅ Conexión exitosa!")
        
        # Obtener información del exchange
        print("\n📊 Información del Exchange:")
        exchange_info = exchange.get_exchange_info()
        print(f"   Nombre: {exchange_info['name']}")
        print(f"   Versión: {exchange_info['version']}")
        print(f"   Países: {', '.join(exchange_info['countries'])}")
        
        # Probar balance
        print("\n💰 Obteniendo balance...")
        try:
            balance = await exchange.fetch_balance()
            print("✅ Balance obtenido exitosamente!")
            
            # Mostrar balances no-cero
            total_balance = balance.get('total', {})
            non_zero_balances = {k: v for k, v in total_balance.items() if v > 0}
            
            if non_zero_balances:
                print("   Balances disponibles:")
                for asset, amount in non_zero_balances.items():
                    print(f"   - {asset}: {amount}")
            else:
                print("   No hay balances disponibles o cuenta vacía")
                
        except Exception as e:
            print(f"⚠️  Error obteniendo balance: {e}")
        
        # Probar mercados
        print("\n📈 Obteniendo mercados...")
        try:
            markets = await exchange.fetch_markets()
            usdt_pairs = [m for m in markets if m.get('quote') == 'USDT' and m.get('active')]
            print(f"✅ {len(markets)} mercados totales, {len(usdt_pairs)} pares USDT activos")
            
            # Mostrar algunos pares populares
            popular_pairs = ['BTC/USDT', 'ETH/USDT', 'KCS/USDT']
            available_pairs = [m['symbol'] for m in markets if m['symbol'] in popular_pairs]
            print(f"   Pares populares disponibles: {', '.join(available_pairs)}")
            
        except Exception as e:
            print(f"⚠️  Error obteniendo mercados: {e}")
        
        # Probar ticker
        print("\n📊 Probando ticker BTC/USDT...")
        try:
            ticker = await exchange.fetch_ticker('BTC/USDT')
            print(f"✅ BTC/USDT: ${ticker['last']:,.2f}")
            print(f"   Volumen 24h: ${ticker['quoteVolume']:,.0f}")
            print(f"   Cambio 24h: {ticker['percentage']:.2f}%")
            
        except Exception as e:
            print(f"⚠️  Error obteniendo ticker: {e}")
        
        # Probar órdenes abiertas
        print("\n📋 Verificando órdenes abiertas...")
        try:
            open_orders = await exchange.fetch_open_orders()
            print(f"✅ {len(open_orders)} órdenes abiertas")
            
        except Exception as e:
            print(f"⚠️  Error obteniendo órdenes: {e}")
        
        print("\n🎉 ¡Prueba de conexión completada exitosamente!")
        print("✅ KuCoin está listo para trading")
        
        # Cerrar conexión
        if hasattr(exchange.exchange, 'close'):
            await exchange.exchange.close()
            
        return True
        
    except Exception as e:
        print(f"❌ Error durante la prueba: {e}")
        return False

async def main():
    """Función principal"""
    print("=" * 60)
    print("🧪 PRUEBA DE CONEXIÓN KUCOIN")
    print("=" * 60)
    
    success = await test_kucoin_connection()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ RESULTADO: Conexión exitosa - KuCoin listo para usar")
    else:
        print("❌ RESULTADO: Error en la conexión - Revisar credenciales")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())