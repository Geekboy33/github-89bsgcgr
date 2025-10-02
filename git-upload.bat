@echo off
REM 🚀 Script para Windows - Subir MarketMaker Pro a GitHub
REM Ejecutar desde la carpeta raíz del proyecto
setlocal enabledelayedexpansion

echo 🚀 Subiendo MarketMaker Pro a GitHub...
echo 📁 Repositorio: https://github.com/Geekboy33/marketmaker-pro.git
echo.

REM Verificar que Git esté instalado
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git no está instalado.
    echo    📥 Descárgalo desde: https://git-scm.com/
    echo    💡 O instala GitHub Desktop: https://desktop.github.com/
    pause
    exit /b 1
)

echo ✅ Git encontrado: 
git --version
echo.

REM Verificar que estemos en la carpeta correcta
if not exist "package.json" (
    echo ❌ No se encontró package.json
    echo    Asegúrate de estar en la carpeta del proyecto MarketMaker Pro
    echo    📁 Archivos en esta carpeta:
    dir /b
    pause
    exit /b 1
)

echo ✅ Verificaciones completadas
echo 📦 Proyecto MarketMaker Pro encontrado
echo.

REM Paso 1: Inicializar repositorio
echo 📁 Paso 1: Inicializando repositorio Git...
if not exist ".git" (
    git init
    echo    ✅ Repositorio Git inicializado
) else (
    echo    ✅ Repositorio Git ya existe
)

REM Paso 2: Agregar archivos
echo 📋 Paso 2: Agregando archivos...
git add .
if errorlevel 1 (
    echo    ❌ Error agregando archivos
    pause
    exit /b 1
)
echo    ✅ Archivos agregados correctamente

REM Paso 3: Crear commit
echo 💾 Paso 3: Creando commit inicial...
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

if errorlevel 1 (
    echo    ⚠️ Error creando commit (puede ser normal si no hay cambios)
) else (
    echo    ✅ Commit creado exitosamente
)

REM Paso 4: Configurar remote
echo 🔗 Paso 4: Configurando repositorio remoto...
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    git remote add origin https://github.com/Geekboy33/marketmaker-pro.git
    echo    ✅ Remote configurado
) else (
    echo    ✅ Remote ya existe
)

REM Paso 5: Configurar rama principal
echo 🌿 Paso 5: Configurando rama principal...
git branch -M main
echo    ✅ Rama main configurada

REM Paso 6: Subir a GitHub
echo 🚀 Paso 6: Subiendo a GitHub...
echo    ⏳ Esto puede tomar unos momentos...
echo    📤 Subiendo archivos...

git push -u origin main
if errorlevel 1 (
    echo.
    echo ❌ Error al subir a GitHub
    echo.
    echo 🔧 Posibles soluciones:
    echo    1. Verifica tu autenticación de GitHub
    echo    2. Asegúrate de que el repositorio existe
    echo    3. Revisa tus permisos de escritura
    echo    4. Configura tu usuario Git:
    echo       git config --global user.name "Tu Nombre"
    echo       git config --global user.email "tu-email@ejemplo.com"
    echo.
    echo 💡 También puedes usar GitHub Desktop para una interfaz gráfica
    pause
    exit /b 1
)

echo.
echo ===============================================
echo 🎉 ¡ÉXITO! MarketMaker Pro subido a GitHub
echo ===============================================
echo.
echo 🌐 Tu repositorio:
echo    https://github.com/Geekboy33/marketmaker-pro
echo.
echo 📊 Estadísticas del proyecto:
echo    📁 Archivos subidos: Todos los componentes
echo    💻 Frontend: React + TypeScript
echo    🔧 Backend: Node.js + Express
echo    🔐 APIs: KuCoin integrado
echo.
echo 📋 Próximos pasos:
echo    1. Ve a GitHub y agrega una descripción
echo    2. Configura topics: cryptocurrency, trading, market-making, react, nodejs
echo    3. Crea un Release v1.0.0
echo    4. Invita colaboradores si es necesario
echo    5. ¡Comparte tu proyecto profesional!
echo.
echo ✅ ¡Tu sistema profesional de Market Making ya está público!
echo 🚀 ¡Felicidades por completar tu proyecto avanzado de trading!
pause