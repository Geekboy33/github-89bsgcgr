#!/bin/bash

# 🚀 Script para subir MarketMaker Pro a GitHub
# Ejecutar desde la carpeta raíz del proyecto

echo "🚀 Subiendo MarketMaker Pro a GitHub..."
echo "📁 Repositorio: https://github.com/Geekboy33/marketmaker-pro.git"
echo ""

# Verificar que Git esté instalado
if ! command -v git &> /dev/null; then
    echo "❌ Git no está instalado."
    echo "   Instálalo desde: https://git-scm.com/"
    exit 1
fi

# Verificar que estemos en la carpeta correcta
if [ ! -f "package.json" ]; then
    echo "❌ No se encontró package.json"
    echo "   Asegúrate de estar en la carpeta del proyecto MarketMaker Pro"
    exit 1
fi

echo "✅ Verificaciones completadas"
echo ""

# Paso 1: Inicializar repositorio
echo "📁 Paso 1: Inicializando repositorio Git..."
git init

# Paso 2: Agregar archivos
echo "📋 Paso 2: Agregando archivos..."
git add .

# Paso 3: Crear commit
echo "💾 Paso 3: Creando commit inicial..."
git commit -m "Initial commit: MarketMaker Pro v1.0.0

🚀 Advanced Crypto Market Making System

Features:
✅ Multi-exchange support (KuCoin, Binance, OKX, Bybit)
✅ Real-time React dashboard with TypeScript
✅ Advanced risk management with circuit breakers
✅ Position and order management system
✅ Backtesting engine with historical simulation
✅ Professional logging and monitoring
✅ Secure API credential handling
✅ Node.js backend with Express
✅ Modern UI with Tailwind CSS
✅ Comprehensive documentation

Tech Stack:
- Frontend: React 18 + TypeScript + Tailwind CSS
- Backend: Node.js + Express + CCXT
- APIs: KuCoin, Binance, and more
- Real-time: WebSocket integration
- Security: Environment-based credentials"

# Paso 4: Configurar remote
echo "🔗 Paso 4: Configurando repositorio remoto..."
git remote add origin https://github.com/Geekboy33/marketmaker-pro.git

# Paso 5: Configurar rama principal
echo "🌿 Paso 5: Configurando rama principal..."
git branch -M main

# Paso 6: Subir a GitHub
echo "🚀 Paso 6: Subiendo a GitHub..."
echo "   Esto puede tomar unos momentos..."

if git push -u origin main; then
    echo ""
    echo "🎉 ¡ÉXITO! MarketMaker Pro subido a GitHub"
    echo ""
    echo "🌐 Tu repositorio:"
    echo "   https://github.com/Geekboy33/marketmaker-pro"
    echo ""
    echo "📋 Próximos pasos:"
    echo "   1. Ve a GitHub y agrega una descripción"
    echo "   2. Configura topics: cryptocurrency, trading, market-making"
    echo "   3. Crea un Release v1.0.0"
    echo "   4. ¡Comparte tu proyecto!"
    echo ""
    echo "✅ ¡Tu sistema profesional de Market Making ya está público!"
else
    echo ""
    echo "❌ Error al subir a GitHub"
    echo ""
    echo "🔧 Posibles soluciones:"
    echo "   1. Verifica tu autenticación de GitHub"
    echo "   2. Asegúrate de que el repositorio existe"
    echo "   3. Revisa tus permisos de escritura"
    echo ""
    echo "💡 Configurar Git (si es necesario):"
    echo "   git config --global user.name 'Tu Nombre'"
    echo "   git config --global user.email 'tu-email@ejemplo.com'"
fi