#!/bin/bash

echo "========================================"
echo "MarketMaker Pro v4.2 - Instalación"
echo "========================================"
echo

echo "[1/4] Instalando dependencias Python..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Falló la instalación de dependencias Python"
    exit 1
fi
echo

echo "[2/4] Instalando dependencias Node.js..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Falló la instalación de dependencias Node.js"
    exit 1
fi
echo

echo "[3/4] Creando directorios necesarios..."
mkdir -p logs
mkdir -p data
echo

echo "[4/4] Verificando configuración..."
if [ ! -f ".env" ]; then
    echo "ADVERTENCIA: Archivo .env no encontrado"
    echo "Por favor crea un archivo .env con tus credenciales"
    echo "Consulta README_v2.md para más información"
fi

if [ ! -f "secrets.json" ]; then
    echo "ADVERTENCIA: Archivo secrets.json no encontrado"
    echo "Por favor crea un archivo secrets.json con tus credenciales"
    echo "Consulta README_v2.md para más información"
fi
echo

echo "========================================"
echo "¡Instalación completada exitosamente!"
echo "========================================"
echo
echo "Para iniciar el sistema:"
echo "  Backend:  python main_v2.py"
echo "  Frontend: npm run dev"
echo
echo "Consulta README_v2.md para más información"
echo

