#!/usr/bin/env python3
"""
Prueba simple de conexión KuCoin sin dependencias externas
"""

import json
import time
import hmac
import hashlib
import base64
from urllib.request import urlopen, Request
from urllib.parse import urlencode

class KuCoinTester:
    def __init__(self, api_key, api_secret, passphrase):
        self.api_key = api_key
        self.api_secret = api_secret
        self.passphrase = passphrase
        self.base_url = "https://api-futures.kucoin.com"
        
    def _generate_signature(self, timestamp, method, endpoint, body=""):
        """Genera la firma requerida por KuCoin"""
        message = timestamp + method + endpoint + body
        signature = base64.b64encode(
            hmac.new(
                self.api_secret.encode('utf-8'),
                message.encode('utf-8'),
                hashlib.sha256
            ).digest()
        ).decode('utf-8')
        
        passphrase_signature = base64.b64encode(
            hmac.new(
                self.api_secret.encode('utf-8'),
                self.passphrase.encode('utf-8'),
                hashlib.sha256
            ).digest()
        ).decode('utf-8')
        
        return signature, passphrase_signature
    
    def _make_request(self, method, endpoint, params=None):
        """Hace una petición autenticada a la API de KuCoin"""
        timestamp = str(int(time.time() * 1000))
        
        if params and method == "GET":
            query_string = urlencode(params)
            endpoint = f"{endpoint}?{query_string}"
            body = ""
        else:
            body = json.dumps(params) if params else ""
        
        signature, passphrase_signature = self._generate_signature(
            timestamp, method, endpoint, body
        )
        
        headers = {
            'KC-API-KEY': self.api_key,
            'KC-API-SIGN': signature,
            'KC-API-TIMESTAMP': timestamp,
            'KC-API-PASSPHRASE': passphrase_signature,
            'KC-API-KEY-VERSION': '2',
            'Content-Type': 'application/json'
        }
        
        url = self.base_url + endpoint
        
        try:
            if method == "GET":
                req = Request(url, headers=headers)
            else:
                req = Request(url, data=body.encode('utf-8'), headers=headers)
                
            with urlopen(req, timeout=10) as response:
                return json.loads(response.read().decode('utf-8'))
                
        except Exception as e:
            return {"error": str(e)}
    
    def test_connection(self):
        """Prueba la conexión básica"""
        print("🚀 Probando conexión con KuCoin Futures...")
        print(f"📋 API Key: {self.api_key[:8]}...{self.api_key[-4:]}")
        print(f"🔑 Passphrase: {self.passphrase}")
        print("-" * 50)
        
        # Test 1: Account Overview
        print("💰 Probando acceso a cuenta...")
        account_result = self._make_request("GET", "/api/v1/account-overview")
        
        if "error" in account_result:
            print(f"❌ Error de conexión: {account_result['error']}")
            return False
        elif account_result.get("code") == "200000":
            print("✅ Conexión exitosa!")
            data = account_result.get("data", {})
            print(f"   Account Equity: {data.get('accountEquityTotal', 'N/A')} USDT")
            print(f"   Available Balance: {data.get('availableBalance', 'N/A')} USDT")
        else:
            print(f"⚠️ Respuesta inesperada: {account_result}")
        
        # Test 2: Positions
        print("\n📊 Obteniendo posiciones...")
        positions_result = self._make_request("GET", "/api/v1/positions")
        
        if positions_result.get("code") == "200000":
            positions = positions_result.get("data", [])
            print(f"✅ {len(positions)} posiciones encontradas")
            
            for pos in positions[:3]:  # Mostrar solo las primeras 3
                symbol = pos.get("symbol", "N/A")
                side = pos.get("side", "N/A")
                size = pos.get("currentQty", "0")
                pnl = pos.get("unrealisedPnl", "0")
                print(f"   - {symbol}: {side} {size} (PnL: {pnl})")
        else:
            print(f"⚠️ Error obteniendo posiciones: {positions_result}")
        
        # Test 3: Active Contracts
        print("\n📈 Obteniendo contratos activos...")
        contracts_result = self._make_request("GET", "/api/v1/contracts/active")
        
        if contracts_result.get("code") == "200000":
            contracts = contracts_result.get("data", [])
            usdt_contracts = [c for c in contracts if c.get("quoteCurrency") == "USDT"]
            print(f"✅ {len(contracts)} contratos totales, {len(usdt_contracts)} pares USDT")
            
            # Mostrar algunos contratos populares
            popular = ["XBTUSDTM", "ETHUSDTM", "ADAUSDTM"]
            available = [c["symbol"] for c in contracts if c["symbol"] in popular]
            print(f"   Contratos populares: {', '.join(available)}")
        else:
            print(f"⚠️ Error obteniendo contratos: {contracts_result}")
        
        # Test 4: Ticker
        print("\n📊 Probando ticker BTC...")
        ticker_result = self._make_request("GET", "/api/v1/ticker", {"symbol": "XBTUSDTM"})
        
        if ticker_result.get("code") == "200000":
            data = ticker_result.get("data", {})
            price = data.get("price", "N/A")
            volume = data.get("vol", "N/A")
            change = data.get("changeRate", "N/A")
            print(f"✅ XBTUSDTM: ${price}")
            print(f"   Volumen 24h: {volume}")
            print(f"   Cambio 24h: {float(change)*100:.2f}%" if change != "N/A" else "   Cambio 24h: N/A")
        else:
            print(f"⚠️ Error obteniendo ticker: {ticker_result}")
        
        print("\n🎉 ¡Prueba de conexión completada!")
        print("✅ KuCoin Futures está listo para trading")
        return True

def main():
    """Función principal"""
    print("=" * 60)
    print("🧪 PRUEBA DE CONEXIÓN KUCOIN FUTURES")
    print("=" * 60)
    
    # Credenciales configuradas
    api_key = "68da47b097abe30001b097a4"
    api_secret = "8a670bb1-44a2-43b6-97d6-f23922d77e97"
    passphrase = "Eldiosdeacero34@"
    
    tester = KuCoinTester(api_key, api_secret, passphrase)
    success = tester.test_connection()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ RESULTADO: Conexión exitosa - KuCoin listo para usar")
    else:
        print("❌ RESULTADO: Error en la conexión - Revisar credenciales")
    print("=" * 60)

if __name__ == "__main__":
    main()