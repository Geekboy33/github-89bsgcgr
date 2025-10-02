# 📁 Estructura del Proyecto MarketMaker Pro

## 🏗️ **Arquitectura General**

```
marketmaker-pro/
├── 📱 Frontend (React + TypeScript)
├── 🔧 Backend (Node.js + Express)
├── 🐍 Backend Alternativo (Python + FastAPI)
├── ⚙️ Configuración
└── 📚 Documentación
```

## 📂 **Estructura Detallada**

```
marketmaker-pro/
│
├── 📱 FRONTEND
│   ├── src/
│   │   ├── components/          # Componentes React
│   │   │   ├── Dashboard.tsx    # Panel principal
│   │   │   ├── KuCoinTest.tsx   # Pruebas de conexión
│   │   │   ├── PositionManager.tsx
│   │   │   ├── RiskControls.tsx
│   │   │   ├── MetricsPanel.tsx
│   │   │   ├── BacktestPanel.tsx
│   │   │   ├── SystemLogs.tsx
│   │   │   ├── AlertsPanel.tsx
│   │   │   ├── ConfigManager.tsx
│   │   │   └── ExchangeConnections.tsx
│   │   │
│   │   ├── context/             # Context API
│   │   │   └── MarketMakerContext.tsx
│   │   │
│   │   ├── api/                 # Clientes API
│   │   │   └── kucoin-proxy.ts
│   │   │
│   │   ├── App.tsx              # Componente principal
│   │   ├── main.tsx             # Punto de entrada
│   │   └── index.css            # Estilos Tailwind
│   │
│   ├── public/                  # Archivos estáticos
│   ├── index.html               # HTML principal
│   ├── package.json             # Dependencias frontend
│   ├── vite.config.ts           # Configuración Vite
│   ├── tailwind.config.js       # Configuración Tailwind
│   └── tsconfig.json            # Configuración TypeScript
│
├── 🔧 BACKEND NODE.JS
│   ├── server.js                # Servidor Express principal
│   └── package.json             # Dependencias backend
│
├── 🐍 BACKEND PYTHON (Alternativo)
│   ├── main.py                  # Servidor FastAPI
│   ├── core/                    # Módulos core
│   │   ├── __init__.py
│   │   ├── logger.py
│   │   ├── utils.py
│   │   └── config_schema.py
│   │
│   ├── exchanges/               # Integraciones exchange
│   │   ├── exchange_factory.py
│   │   └── multi_exchange_manager.py
│   │
│   └── requirements.txt         # Dependencias Python
│
├── ⚙️ CONFIGURACIÓN
│   ├── config.json              # Configuración principal
│   ├── config/
│   │   ├── config.yaml          # Config detallada
│   │   └── secrets.yaml         # Plantilla secretos
│   │
│   ├── .env.example             # Variables de entorno
│   ├── .gitignore               # Archivos ignorados
│   └── eslint.config.js         # Configuración ESLint
│
├── 🧪 TESTING
│   ├── test_kucoin_simple.py    # Test Python KuCoin
│   ├── test_kucoin_connection.py
│   ├── test-kucoin-direct.js    # Test Node.js KuCoin
│   └── verify-github.js         # Verificar GitHub
│
└── 📚 DOCUMENTACIÓN
    ├── README.md                # Documentación principal
    ├── upload-to-github.md      # Guía para GitHub
    ├── git-commands.sh          # Script de subida
    └── project-structure.md     # Este archivo
```

## 🎯 **Componentes Principales**

### 📱 **Frontend (React + TypeScript)**
- **Dashboard**: Métricas en tiempo real
- **KuCoin Test**: Verificación de conexión API
- **Position Manager**: Gestión de posiciones y órdenes
- **Risk Controls**: Configuración de límites de riesgo
- **Backtest Panel**: Simulaciones históricas
- **System Logs**: Monitoreo y debugging
- **Config Manager**: Configuración avanzada

### 🔧 **Backend (Node.js)**
- **Express Server**: API REST principal
- **KuCoin Integration**: Conexión directa con KuCoin
- **CORS Proxy**: Resolver problemas de CORS
- **Real-time Data**: WebSocket para datos en vivo

### 🐍 **Backend Python (Alternativo)**
- **FastAPI**: API moderna y rápida
- **CCXT Integration**: Soporte multi-exchange
- **Advanced Features**: Funcionalidades avanzadas

## 🔧 **Tecnologías Utilizadas**

### Frontend
- ⚛️ **React 18** con Hooks
- 📘 **TypeScript** para type safety
- 🎨 **Tailwind CSS** para estilos
- ⚡ **Vite** como bundler
- 🎯 **Lucide React** para iconos

### Backend
- 🟢 **Node.js** con Express
- 🐍 **Python** con FastAPI (alternativo)
- 🔄 **CCXT** para exchanges
- 🌐 **CORS** handling
- 📊 **Real-time WebSocket**

### Herramientas
- 📦 **npm/yarn** para dependencias
- 🔧 **ESLint** para linting
- 🎨 **Prettier** para formateo
- 🧪 **Testing** scripts incluidos

## 🚀 **Flujo de Desarrollo**

1. **Frontend** se ejecuta en puerto 5173 (Vite)
2. **Backend** se ejecuta en puerto 8000 (Express/FastAPI)
3. **Proxy** maneja las peticiones entre frontend y APIs
4. **Hot Reload** para desarrollo rápido

## 📋 **Archivos de Configuración**

- **package.json**: Dependencias y scripts
- **vite.config.ts**: Configuración del bundler
- **tailwind.config.js**: Estilos y tema
- **tsconfig.json**: Configuración TypeScript
- **.env.example**: Variables de entorno
- **config.json**: Configuración del trading

¡Esta estructura modular permite fácil mantenimiento y escalabilidad! 🚀💰