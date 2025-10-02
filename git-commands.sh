#!/bin/bash

# 🚀 Script para subir MarketMaker Pro a GitHub
# Ejecutar desde la carpeta raíz del proyecto

echo "🚀 Preparando MarketMaker Pro para GitHub..."

# Verificar que Git esté instalado
if ! command -v git &> /dev/null; then
    echo "❌ Git no está instalado. Por favor instálalo primero."
    echo "   Windows: https://git-scm.com/"
    echo "   Mac: brew install git"
    echo "   Linux: sudo apt install git"
    exit 1
fi

echo "✅ Git encontrado: $(git --version)"

# Verificar que estemos en un directorio con archivos del proyecto
if [ ! -f "package.json" ]; then
    echo "❌ No se encontró package.json. Asegúrate de estar en la carpeta del proyecto."
    exit 1
fi

echo "✅ Archivos del proyecto encontrados"

# Inicializar repositorio si no existe
if [ ! -d ".git" ]; then
    echo "📁 Inicializando repositorio Git..."
    git init
else
    echo "✅ Repositorio Git ya existe"
fi

# Agregar archivos
echo "📋 Agregando archivos al repositorio..."
git add .

# Verificar que hay cambios para commitear
if git diff --staged --quiet; then
    echo "⚠️  No hay cambios para commitear"
else
    # Crear commit
    echo "💾 Creando commit inicial..."
    git commit -m "Initial commit: MarketMaker Pro v1.0.0

- Complete React TypeScript frontend with modern UI
- Node.js backend with Express and KuCoin integration  
- Multi-exchange support architecture (Binance, KuCoin, OKX, Bybit)
- Real-time dashboard with live metrics and charts
- Advanced risk management with circuit breakers
- Position and order management system
- Backtesting engine with historical simulation
- Comprehensive logging and alerting system
- Secure API credential handling
- Professional documentation and setup guides

Features:
✅ Multi-exchange trading support
✅ Real-time market data and metrics
✅ Risk management and position limits
✅ Backtesting and strategy simulation
✅ Modern React dashboard with TypeScript
✅ Secure credential management
✅ Professional logging and monitoring
✅ Comprehensive documentation"
fi

# Configurar remote si no existe
if ! git remote get-url origin &> /dev/null; then
    echo "🔗 Configurando remote de GitHub..."
    git remote add origin https://github.com/Geekboy33/marketmaker-pro.git
else
    echo "✅ Remote de GitHub ya configurado"
fi

# Configurar rama principal
echo "🌿 Configurando rama principal..."
git branch -M main

# Subir a GitHub
echo "🚀 Subiendo a GitHub..."
echo "   Repositorio: https://github.com/Geekboy33/marketmaker-pro"

if git push -u origin main; then
    echo ""
    echo "🎉 ¡ÉXITO! MarketMaker Pro subido a GitHub"
    echo ""
    echo "🌐 Tu repositorio está disponible en:"
    echo "   https://github.com/Geekboy33/marketmaker-pro"
    echo ""
    echo "📋 Próximos pasos recomendados:"
    echo "   1. Agrega una descripción en GitHub"
    echo "   2. Configura topics: cryptocurrency, trading, market-making"
    echo "   3. Crea un Release para la versión v1.0.0"
    echo "   4. Invita colaboradores si es necesario"
    echo ""
    echo "✅ ¡Tu proyecto profesional ya está en GitHub!"
else
    echo ""
    echo "❌ Error al subir a GitHub"
    echo ""
    echo "🔧 Posibles soluciones:"
    echo "   1. Verifica que el repositorio existe en GitHub"
    echo "   2. Asegúrate de tener permisos de escritura"
    echo "   3. Configura tu autenticación de GitHub"
    echo "   4. Revisa la URL del repositorio"
    echo ""
    echo "💡 Para configurar autenticación:"
    echo "   git config --global user.name 'Tu Nombre'"
    echo "   git config --global user.email 'tu-email@ejemplo.com'"
fi