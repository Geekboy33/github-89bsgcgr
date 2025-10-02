@echo off
echo ========================================
echo MarketMaker Pro v4.2 - Instalacion
echo ========================================
echo.

echo [1/4] Instalando dependencias Python...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Fallo la instalacion de dependencias Python
    pause
    exit /b 1
)
echo.

echo [2/4] Instalando dependencias Node.js...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Fallo la instalacion de dependencias Node.js
    pause
    exit /b 1
)
echo.

echo [3/4] Creando directorios necesarios...
if not exist "logs" mkdir logs
if not exist "data" mkdir data
echo.

echo [4/4] Verificando configuracion...
if not exist ".env" (
    echo ADVERTENCIA: Archivo .env no encontrado
    echo Por favor crea un archivo .env con tus credenciales
    echo Consulta README_v2.md para mas informacion
)
if not exist "secrets.json" (
    echo ADVERTENCIA: Archivo secrets.json no encontrado
    echo Por favor crea un archivo secrets.json con tus credenciales
    echo Consulta README_v2.md para mas informacion
)
echo.

echo ========================================
echo Instalacion completada exitosamente!
echo ========================================
echo.
echo Para iniciar el sistema:
echo   Backend:  python main_v2.py
echo   Frontend: npm run dev
echo.
echo Consulta README_v2.md para mas informacion
echo.
pause

