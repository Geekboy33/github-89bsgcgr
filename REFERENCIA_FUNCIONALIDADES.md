# 📚 REFERENCIA RÁPIDA DE FUNCIONALIDADES - MARKETMAKER PRO

## 🎯 GUÍA DE USO RÁPIDO

### Iniciar el Sistema

```bash
# Backend (Node.js - recomendado)
npm run server

# O Backend Python (alternativo)
python main.py

# Frontend (en otra terminal)
npm run dev
```

### Acceder a la Interfaz

```
Frontend: http://localhost:5173
Backend API: http://localhost:8000
API Docs: http://localhost:8000/docs (si FastAPI)
```

---

## 📡 API ENDPOINTS COMPLETA

### **Endpoints Generales**

| Método | Endpoint | Descripción | Parámetros | Respuesta |
|--------|----------|-------------|------------|-----------|
| GET | `/` | Info de la API | - | `{message, version}` |
| GET | `/health` | Health check | - | `{status, timestamp}` |
| GET | `/config` | Configuración actual | - | `{exchanges, config}` |
| GET | `/api/test` | Test endpoint | - | `{status, timestamp, kucoin_configured}` |

### **KuCoin Específico**

| Método | Endpoint | Descripción | Body | Respuesta |
|--------|----------|-------------|------|-----------|
| GET | `/api/kucoin-credentials-check` | Verificar credenciales | - | `{api_key_configured, all_configured}` |
| GET | `/api/kucoin-connection-test` | Test conexión real | - | `{connected, account_data}` |
| POST | `/api/kucoin-test-proxy` | Proxy para tests | `{testType, params}` | `{success, data, error}` |

### **Trading (Pendientes de Implementar)**

| Método | Endpoint | Descripción | Body/Params | Respuesta |
|--------|----------|-------------|-------------|-----------|
| GET | `/api/v1/market-data` | Datos de mercado | - | `[{symbol, price, volume, ...}]` |
| GET | `/api/v1/positions` | Posiciones abiertas | - | `[{symbol, side, size, pnl, ...}]` |
| GET | `/api/v1/orders` | Órdenes abiertas | - | `[{id, symbol, side, amount, ...}]` |
| GET | `/api/v1/metrics` | Métricas del sistema | - | `{equity, pnl, openOrders, ...}` |
| GET | `/api/v1/system/status` | Estado del sistema | - | `{connected, exchanges, health}` |
| PUT | `/api/v1/risk/mode` | Cambiar modo riesgo | `{mode}` | `{success, mode}` |
| POST | `/api/v1/orders/{id}/cancel` | Cancelar orden | - | `{success}` |
| POST | `/api/v1/positions/{symbol}/close` | Cerrar posición | - | `{success}` |

---

## 🔧 MÓDULOS PYTHON

### **exchanges/exchange_factory.py**

#### **Clase ExchangeWrapper**

```python
# Métodos de Conexión
await connect() -> bool
await shutdown()

# Datos de Mercado
await fetch_balance() -> dict
await fetch_positions(symbols: List[str]) -> List[dict]
await fetch_order_book(symbol: str, limit: int) -> dict
await fetch_ticker(symbol: str) -> dict
await fetch_tickers() -> dict
await fetch_ohlcv(symbol: str, timeframe: str, since: int, limit: int) -> List
await fetch_markets() -> List[dict]
await fetch_funding_rate(symbol: str) -> dict

# Trading
await create_order(
    symbol: str,
    type: OrderType,    # LIMIT | MARKET
    side: OrderSide,    # BUY | SELL
    amount: float,
    price: float = None
) -> Order

await cancel_order(order_id: str, symbol: str) -> dict
await fetch_open_orders(symbol: str = None) -> List[Order]
await fetch_my_trades(symbol: str, since: int, limit: int) -> List[dict]

# Configuración
await set_leverage(symbol: str, leverage: float) -> bool
await set_margin_mode(symbol: str, margin_mode: str) -> bool

# Información
get_exchange_info() -> dict
```

#### **Clase ExchangeFactory**

```python
# Métodos Estáticos
@staticmethod
create_exchange(exchange_name: str, config: dict) -> ExchangeWrapper

@staticmethod
get_supported_exchanges() -> List[str]
# Returns: ['binance', 'kucoin', 'okx', 'bybit', 'gate', 
#           'huobi', 'ftx', 'kraken', 'coinbase', 'bitfinex']

@staticmethod
validate_exchange_config(exchange_name: str, config: dict) -> bool
```

### **exchanges/multi_exchange_manager.py**

#### **Clase MultiExchangeManager**

```python
# Inicialización
async initialize()
async shutdown()

# Monitoreo
async start_health_monitoring()
get_healthy_exchanges() -> List[str]
get_exchange_health() -> Dict[str, ExchangeHealth]
is_system_healthy() -> bool

# Selección de Exchange
get_exchange_for_symbol(symbol: str) -> Optional[ExchangeWrapper]
get_all_exchanges() -> Dict[str, ExchangeWrapper]

# Símbolos
get_symbols_for_exchange(exchange_name: str) -> List[str]
get_all_symbols() -> List[str]
```

#### **Clase ExchangeHealth**

```python
@dataclass
class ExchangeHealth:
    name: str                # Nombre del exchange
    connected: bool          # Estado de conexión
    last_ping: float        # Timestamp último ping
    latency_ms: float       # Latencia en milisegundos
    error_count: int        # Contador de errores
    success_rate: float     # Tasa de éxito (0.0-1.0)
    api_calls_used: int     # Llamadas API usadas
    api_calls_limit: int    # Límite de llamadas
    features: dict          # Features disponibles
```

### **core/utils.py**

```python
def load_yaml(file_path: str) -> dict
def load_json(file_path: str) -> dict
```

---

## ⚛️ COMPONENTES REACT

### **1. App.tsx** - Componente Principal

```typescript
// Props: ninguno
// State:
- activeTab: string          // Tab actual seleccionado
- isRunning: bool           // Estado del bot

// Tabs disponibles:
- dashboard
- positions
- metrics
- backtest
- exchanges
- kucoin-test
- config
- logs
- risk
- alerts
```

### **2. MarketMakerContext.tsx** - Context Provider

```typescript
// Context State:
interface MarketMakerContextType {
    marketData: MarketData[]
    positions: Position[]
    orders: OrderData[]
    metrics: SystemMetrics
    isConnected: bool
    isLoading: bool
    error: string | null
    
    // Métodos:
    updateRiskMode: (mode) => void
    cancelOrder: (orderId) => void
    closePosition: (symbol) => void
    refreshData: () => Promise<void>
}

// Uso:
const { marketData, positions, metrics } = useMarketMaker()
```

### **3. Dashboard.tsx** - Vista Principal

```typescript
// Muestra:
- Cards de métricas:
  * Total Equity
  * Daily PnL
  * Open Orders
  * System Health
  
- Tabla de mercados activos:
  * Symbol, Price, 24h Change
  * Volume, Spread, Volatility
  
- Indicador de Risk Mode
```

### **4. PositionManager.tsx** - Gestión de Posiciones

```typescript
// Tablas:
1. Open Positions
   - Symbol, Side (Long/Short)
   - Size, Entry/Mark Price
   - PnL, Unrealized PnL
   - Botón: Close Position
   
2. Open Orders
   - Symbol, Side, Type
   - Amount, Price, Status
   - Timestamp
   - Botón: Cancel Order
```

### **5. RiskControls.tsx** - Control de Riesgo

```typescript
// Secciones:
1. Risk Mode Selection
   - Conservative
   - Aggressive
   - Aggressive Plus
   
2. Position Limits
   - Max Inventory per Symbol
   - Max Orders per Symbol
   - Maximum Leverage
   
3. Circuit Breaker Settings
   - Latency Threshold
   - Spread Threshold
   - Volatility Threshold
```

### **6. MetricsPanel.tsx** - Panel de Métricas

```typescript
// Métricas mostradas:
- Financials: PnL, Equity, ROI
- Performance: Win Rate, Sharpe
- Operational: Orders, Fills
- Technical: Latency, Uptime
```

### **7. ExchangeConnections.tsx** - Estado de Exchanges

```typescript
// Por cada exchange muestra:
- Estado: Connected/Disconnected
- Latencia
- Success Rate
- Features disponibles
- Símbolos configurados
- Botones: Test/Reconnect
```

### **8. KuCoinTest.tsx** - Tests KuCoin

```typescript
// Tests disponibles:
1. Account Overview
2. Account Info
3. Symbols
4. BTC Ticker

// Muestra:
- Estado de cada test
- Resultados en tiempo real
- JSON data completo
- Resumen de éxito/fallos
```

### **9. SystemLogs.tsx** - Logs del Sistema

```typescript
// Muestra logs con:
- Timestamp
- Level (INFO/WARNING/ERROR)
- Module
- Message
- Filtros por nivel
```

### **10. AlertsPanel.tsx** - Panel de Alertas

```typescript
// Configuración de alertas:
- Telegram settings
- Email settings
- Discord webhook
- Alert levels
```

### **11. BacktestPanel.tsx** - Backtesting

```typescript
// (No implementado completamente)
// Permitirá:
- Seleccionar periodo histórico
- Configurar parámetros
- Ejecutar backtest
- Ver resultados
```

### **12. ConfigManager.tsx** - Gestor de Configuración

```typescript
// Editor de configuración:
- Exchange settings
- Risk parameters
- Symbol selection
- Trading parameters
```

---

## 📊 INTERFACES Y TIPOS

### **TypeScript Types**

```typescript
interface MarketData {
    symbol: string
    price: number
    change24h: number
    volume: number
    spread: number
    volatility: number
}

interface Position {
    symbol: string
    side: 'long' | 'short'
    size: number
    entryPrice: number
    markPrice: number
    pnl: number
    unrealizedPnl: number
}

interface OrderData {
    id: string
    symbol: string
    side: 'buy' | 'sell'
    type: 'limit' | 'market'
    amount: number
    price: number
    status: 'open' | 'filled' | 'canceled'
    timestamp: number
}

interface SystemMetrics {
    equity: number
    totalPnl: number
    dailyPnl: number
    totalFees: number
    openOrders: number
    healthyExchanges: number
    openCircuits: number
    riskMode: 'conservative' | 'aggressive' | 'aggressive_plus'
}
```

### **Python Classes**

```python
class Order:
    id: str
    symbol: str
    type: OrderType        # LIMIT | MARKET
    side: OrderSide        # BUY | SELL
    amount: float
    price: float
    status: str           # open | filled | canceled
    timestamp: int

class OrderType(Enum):
    LIMIT = "limit"
    MARKET = "market"

class OrderSide(Enum):
    BUY = "buy"
    SELL = "sell"
```

---

## ⚙️ CONFIGURACIÓN

### **Estructura de config.json**

```json
{
  "market_maker_v4_2": {
    "risk_mode": "conservative | aggressive | aggressive_plus",
    "api_timeout": 30,
    "rate_limit": 250,
    "default_type": "future",
    "hedge_mode": true,
    "isolated_margin": true,
    "leverage": 100,
    "margin_pct": 0.01,
    "refresh_ms": 250,
    "symbols": ["BTC/USDT", "ETH/USDT"]
  }
}
```

### **Estructura de secrets.json**

```json
{
  "exchanges": {
    "kucoin": {
      "api_key": "your_api_key",
      "api_secret": "your_api_secret",
      "passphrase": "your_passphrase"
    },
    "binance": {
      "api_key": "your_api_key",
      "api_secret": "your_api_secret"
    },
    "bybit": {
      "api_key": "your_api_key",
      "api_secret": "your_api_secret"
    }
  },
  "alerts": {
    "telegram": {
      "bot_token": "your_bot_token",
      "chat_id": "your_chat_id"
    }
  }
}
```

### **Variables de Entorno (.env)**

```bash
# KuCoin
KUCOIN_API_KEY=xxx
KUCOIN_API_SECRET=xxx
KUCOIN_PASSPHRASE=xxx

# Binance
BINANCE_API_KEY=xxx
BINANCE_API_SECRET=xxx

# Bybit
BYBIT_API_KEY=xxx
BYBIT_API_SECRET=xxx

# Telegram
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_CHAT_ID=xxx

# Servidor
PORT=8000
```

---

## 🎛️ PARÁMETROS DE RIESGO

### **Modos de Riesgo**

```yaml
CONSERVATIVE:
  margin_pct: 0.01              # 1%
  ladder_levels: 1
  mm_spread_bps: 6              # 0.06%
  max_inventory_per_symbol: 10000

AGGRESSIVE:
  margin_pct: 0.05              # 5%
  ladder_levels: 5
  mm_spread_bps: 6
  ladder_step_bps: 1.6
  max_inventory_per_symbol: 50000

AGGRESSIVE_PLUS:
  margin_pct: 0.06              # 6%
  ladder_levels: 7
  mm_spread_bps: 6
  ladder_step_bps: 1.6
  max_inventory_per_symbol: 50000
```

### **Circuit Breakers**

```yaml
latency_threshold_ms: 500       # Latencia máxima
spread_threshold_bps: 20        # Spread máximo 0.2%
volatility_threshold: 0.05      # Volatilidad máxima 5%
error_rate_threshold: 0.1       # Error rate máximo 10%
drawdown_threshold_bps: 100     # Drawdown máximo 1%
circuit_cooldown_seconds: 300   # 5 minutos cooldown
```

### **Límites de Posición**

```yaml
max_open_orders_per_symbol: 50
max_global_open_orders: 1500
max_net_inventory_usd_per_symbol: 50000
max_global_net_inventory_usd: 400000
max_per_exchange_inventory_usd: 200000
```

### **Order Hygiene**

```yaml
max_order_age_sec: 90           # Edad máxima de orden
drift_bps_requote: 3            # Drift para recotizar
stale_depth_bps: 8              # Depth stale threshold
max_replace_per_cycle: 20       # Max replacements
min_delay_between_requotes_ms: 150  # Delay mínimo
```

---

## 🔍 COMANDOS ÚTILES

### **NPM Scripts**

```bash
npm run dev          # Iniciar frontend (Vite)
npm run build        # Build para producción
npm run preview      # Preview build
npm run server       # Iniciar backend Node.js
npm run lint         # Lint código
npm run typecheck    # Type checking TypeScript
```

### **Python Commands**

```bash
python main.py                      # Iniciar backend FastAPI
python test_kucoin_connection.py    # Test conexión KuCoin
python test_kucoin_simple.py        # Test simple KuCoin
```

### **Git Commands (proporcionados)**

```bash
./git-upload.sh      # Upload a GitHub (Linux/Mac)
git-upload.bat       # Upload a GitHub (Windows)
```

---

## 🛠️ TROUBLESHOOTING

### **Problemas Comunes**

#### **1. Error de CORS**
```
Solución: El backend actúa como proxy
- Frontend llama a localhost:8000
- Backend llama al exchange
- No hay CORS issues
```

#### **2. Credenciales no configuradas**
```
Verificar:
1. secrets.json existe
2. .env tiene las variables
3. Formato correcto de API keys
4. Passphrase para KuCoin/OKX
```

#### **3. Exchange no conecta**
```
Verificar:
1. API keys válidas
2. IP whitelisted (si aplica)
3. Permissions correctos
4. Testnet vs Mainnet
```

#### **4. Frontend no muestra datos**
```
Verificar:
1. Backend corriendo en puerto 8000
2. CORS configurado correctamente
3. Endpoints implementados
4. Console del navegador para errores
```

#### **5. Órdenes no se crean**
```
Verificar:
1. Hedge mode configurado
2. Leverage establecido
3. Margin mode correcto
4. Balance suficiente
5. Límites de riesgo no excedidos
```

---

## 📈 MÉTRICAS MONITOREADAS

### **Financieras**
- **Equity**: Patrimonio total
- **Total PnL**: Ganancias/pérdidas acumuladas
- **Daily PnL**: PnL del día actual
- **Total Fees**: Fees pagados totales
- **ROI**: Return on Investment
- **Sharpe Ratio**: Ratio de Sharpe

### **Operacionales**
- **Open Orders**: Órdenes abiertas actuales
- **Filled Orders**: Órdenes ejecutadas
- **Canceled Orders**: Órdenes canceladas
- **Fill Rate**: Tasa de ejecución
- **Average Fill Time**: Tiempo promedio de fill

### **Técnicas**
- **Latency**: Latencia promedio por exchange
- **Success Rate**: Tasa de éxito de llamadas API
- **Error Count**: Contador de errores
- **API Calls Used**: Llamadas API consumidas
- **Uptime**: Tiempo activo del sistema

### **Por Exchange**
- **Connected**: Estado de conexión
- **Healthy**: Estado de salud
- **Active Symbols**: Símbolos activos
- **Orders**: Órdenes por exchange
- **Volume**: Volumen operado

---

## 🎯 FUNCIONALIDADES IMPLEMENTADAS

✅ **Completamente Funcional:**
- ✅ Conexión multi-exchange (Binance, KuCoin, OKX, Bybit, Gate)
- ✅ Health monitoring de exchanges
- ✅ Estrategias de selección (Failover, Load Balance, Best Execution)
- ✅ Test de conexión KuCoin
- ✅ Frontend completo con UI moderna
- ✅ Sistema de configuración multi-nivel
- ✅ CORS proxy para evitar errores
- ✅ Gestión de credenciales segura

⚠️ **Parcialmente Implementado:**
- ⚠️ API endpoints (estructura existe, lógica faltante)
- ⚠️ Market making engine (código base existe)
- ⚠️ Risk management (circuit breakers definidos)

❌ **No Implementado:**
- ❌ Trading real automático
- ❌ Base de datos / persistencia
- ❌ WebSocket en tiempo real
- ❌ Backtesting engine
- ❌ Sistema de alertas Telegram
- ❌ Prometheus metrics export

---

## 📞 CONTACTO Y SOPORTE

### **Logs del Sistema**

```bash
# Ver logs backend
tail -f backend.log

# Ver logs en consola
# Los logs aparecen en terminal donde se ejecuta
```

### **Debug Mode**

```python
# En main.py cambiar nivel de log:
logging.basicConfig(level=logging.DEBUG)
```

```typescript
// En frontend, console del navegador:
localStorage.debug = '*'  // Habilitar todos los logs
```

---

**Documento de Referencia Generado:** 2025-10-01  
**Versión del Sistema:** MarketMaker Pro 4.2  
**Última Actualización:** Análisis Completo

