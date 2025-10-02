# 🔄 DIAGRAMAS DE FLUJO TÉCNICO - MARKETMAKER PRO

## 📋 ÍNDICE
1. [Flujo de Inicialización](#flujo-de-inicialización)
2. [Flujo de Trading](#flujo-de-trading)
3. [Flujo de Gestión de Riesgo](#flujo-de-gestión-de-riesgo)
4. [Flujo de Datos Frontend-Backend](#flujo-de-datos-frontend-backend)
5. [Flujo de Multi-Exchange](#flujo-de-multi-exchange)

---

## 1️⃣ FLUJO DE INICIALIZACIÓN

```
┌─────────────────────────────────────────────────────────────┐
│                    INICIO DEL SISTEMA                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Cargar config.json    │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │  Cargar secrets.json   │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │   Cargar .env vars     │
              │  (override secrets)    │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │   Validar config       │
              └───────────┬────────────┘
                          │
                          ▼
         ┌────────────────┴────────────────┐
         │                                  │
         ▼                                  ▼
┌──────────────────┐            ┌──────────────────┐
│ Python Backend   │            │ Node.js Backend  │
│   (FastAPI)      │     O      │   (Express)      │
│   Puerto 8000    │            │   Puerto 8000    │
└────────┬─────────┘            └─────────┬────────┘
         │                                 │
         └────────────────┬────────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Para cada exchange:    │
              │ - Binance             │
              │ - KuCoin              │
              │ - OKX                 │
              │ - Bybit               │
              │ - Gate.io             │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Crear ExchangeWrapper  │
              │ con CCXT              │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Configurar exchange:   │
              │ - API Keys            │
              │ - Hedge Mode          │
              │ - Leverage            │
              │ - Margin Mode         │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Test Connection        │
              │ (load_markets)         │
              └───────────┬────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
         ┌────────────┐      ┌────────────┐
         │  SUCCESS   │      │   ERROR    │
         │ Connected  │      │  Log error │
         └──────┬─────┘      └──────┬─────┘
                │                   │
                └─────────┬─────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Registrar en           │
              │ MultiExchangeManager   │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Iniciar Health         │
              │ Monitoring Loop        │
              │ (cada 30s)            │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Iniciar React Frontend │
              │ Puerto 5173           │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │   SISTEMA ACTIVO       │
              │   Esperando comandos   │
              └────────────────────────┘
```

---

## 2️⃣ FLUJO DE TRADING (Market Making Loop)

```
┌─────────────────────────────────────────────────────────────┐
│              MARKET MAKING CYCLE (cada 250ms)                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Obtener símbolos      │
              │  activos a operar      │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │  Para cada símbolo:    │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Seleccionar exchange   │
              │ (según estrategia)     │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Verificar Circuit      │
              │ Breakers               │
              └───────────┬────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
         ┌────────────┐      ┌────────────┐
         │   OK       │      │  CIRCUIT   │
         │            │      │  ABIERTO   │
         └──────┬─────┘      └──────┬─────┘
                │                   │
                │                   ▼
                │            ┌────────────┐
                │            │  SKIP      │
                │            │  símbolo   │
                │            └────────────┘
                │
                ▼
              ┌────────────────────────┐
              │ Fetch Market Data:     │
              │ - Ticker              │
              │ - Order Book          │
              │ - Funding Rate        │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Calcular Métricas:     │
              │ - Mid Price           │
              │ - Spread actual       │
              │ - Volatilidad         │
              │ - Volumen             │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Verificar condiciones: │
              │ - Spread > threshold? │
              │ - Volatility OK?      │
              │ - Liquidity OK?       │
              └───────────┬────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
         ┌────────────┐      ┌────────────┐
         │   SÍ       │      │    NO      │
         │ Continuar  │      │   SKIP     │
         └──────┬─────┘      └────────────┘
                │
                ▼
              ┌────────────────────────┐
              │ Calcular Precios:      │
              │                        │
              │ BID_PRICE = mid * (1 - spread/2)
              │ ASK_PRICE = mid * (1 + spread/2)
              │                        │
              │ Para cada ladder level:│
              │   BID[n] = BID - (n * step)
              │   ASK[n] = ASK + (n * step)
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Calcular Tamaño:       │
              │                        │
              │ size = volume_factor * │
              │        volatility *    │
              │        usd_per_order   │
              │                        │
              │ Min: $50, Max: $500    │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Verificar Límites:     │
              │ - Net inventory < max?│
              │ - Open orders < max?  │
              │ - Leverage OK?        │
              └───────────┬────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
         ┌────────────┐      ┌────────────┐
         │   OK       │      │  LÍMITE    │
         │            │      │  ALCANZADO │
         └──────┬─────┘      └──────┬─────┘
                │                   │
                │                   ▼
                │            ┌────────────┐
                │            │  Clamp     │
                │            │  side o    │
                │            │  reducir   │
                │            └────────────┘
                │
                ▼
              ┌────────────────────────┐
              │ Crear órdenes:         │
              │                        │
              │ BUY orders (bids):     │
              │   [level1, level2, ...│
              │    levelN]            │
              │                        │
              │ SELL orders (asks):    │
              │   [level1, level2, ...│
              │    levelN]            │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Enviar órdenes al      │
              │ exchange via CCXT      │
              └───────────┬────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
         ┌────────────┐      ┌────────────┐
         │  SUCCESS   │      │   ERROR    │
         │            │      │            │
         └──────┬─────┘      └──────┬─────┘
                │                   │
                │                   ▼
                │            ┌────────────┐
                │            │ Log error  │
                │            │ Increment  │
                │            │ error_count│
                │            └──────┬─────┘
                │                   │
                └─────────┬─────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Registrar en tracking: │
              │ - Order IDs           │
              │ - Timestamp           │
              │ - Expected fills      │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │  Siguiente símbolo     │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Dormir 250ms          │
              │ (rate limiting)        │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │  REPETIR CICLO         │
              └────────────────────────┘
```

---

## 3️⃣ FLUJO DE GESTIÓN DE RIESGO

```
┌─────────────────────────────────────────────────────────────┐
│             RISK MANAGEMENT CYCLE (cada 5s)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Fetch Posiciones      │
              │  de todos exchanges    │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Calcular Net Inventory │
              │ por símbolo           │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Calcular PnL:          │
              │ - Realizado           │
              │ - No realizado        │
              │ - Por exchange        │
              │ - Total               │
              └───────────┬────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    CIRCUIT BREAKER CHECKS                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   LATENCY    │  │   SPREAD     │  │  VOLATILITY  │
│              │  │              │  │              │
│ latency_ms > │  │ spread >     │  │ vol > 5%?    │
│ 500ms?       │  │ 20 bps?      │  │              │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │  ALGUNO     │
                  │  TRUE?      │
                  └──────┬──────┘
                         │
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
         ┌────────────┐    ┌────────────┐
         │    SÍ      │    │    NO      │
         │            │    │  Continuar │
         └──────┬─────┘    └────────────┘
                │
                ▼
      ┌─────────────────────┐
      │  ABRIR CIRCUITO:    │
      │                     │
      │  1. Cancelar todas  │
      │     órdenes open    │
      │                     │
      │  2. Pausar trading  │
      │     en exchange     │
      │                     │
      │  3. Log evento      │
      │                     │
      │  4. Enviar alerta   │
      │     (Telegram)      │
      │                     │
      │  5. Iniciar cooldown│
      │     (300 segundos)  │
      └──────────┬──────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    INVENTORY CHECKS                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ PER-SYMBOL   │  │   GLOBAL     │  │ PER-EXCHANGE │
│              │  │              │  │              │
│ inventory >  │  │ inventory >  │  │ inventory >  │
│ $50,000?     │  │ $400,000?    │  │ $200,000?    │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │  ALGUNO     │
                  │  TRUE?      │
                  └──────┬──────┘
                         │
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
         ┌────────────┐    ┌────────────┐
         │    SÍ      │    │    NO      │
         │            │    │     OK     │
         └──────┬─────┘    └────────────┘
                │
                ▼
      ┌─────────────────────┐
      │  ACCIONES:          │
      │                     │
      │  1. Cancelar nuevas │
      │     órdenes en      │
      │     lado largo      │
      │                     │
      │  2. Solo permitir   │
      │     órdenes que     │
      │     cierren inv.    │
      │                     │
      │  3. Iniciar         │
      │     rebalanceo      │
      │                     │
      │  4. Log warning     │
      └──────────┬──────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    DRAWDOWN CHECK                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ Calcular drawdown:     │
              │                        │
              │ DD = (peak - current)  │
              │      / peak * 10000    │
              │                        │
              │ (en basis points)      │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │  DD > 100 bps (1%)?    │
              └───────────┬────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
         ┌────────────┐      ┌────────────┐
         │    SÍ      │      │    NO      │
         │ CRÍTICO    │      │     OK     │
         └──────┬─────┘      └────────────┘
                │
                ▼
      ┌─────────────────────┐
      │  ACCIÓN CRÍTICA:    │
      │                     │
      │  1. STOP ALL        │
      │     trading         │
      │                     │
      │  2. Cancelar TODAS  │
      │     órdenes         │
      │                     │
      │  3. Cerrar TODAS    │
      │     posiciones      │
      │                     │
      │  4. ALERTA CRÍTICA  │
      │     a admin         │
      │                     │
      │  5. Esperar         │
      │     intervención    │
      │     manual          │
      └──────────┬──────────┘
                 │
                 ▼
              ┌────────────────────────┐
              │  Dormir 5 segundos     │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │  REPETIR CICLO         │
              └────────────────────────┘
```

---

## 4️⃣ FLUJO DE DATOS FRONTEND-BACKEND

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│                    React App (Port 5173)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ HTTP/REST
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                              │
│              FastAPI/Node.js (Port 8000)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ CCXT Library
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        EXCHANGES                             │
│          Binance, KuCoin, OKX, Bybit, Gate.io                │
└─────────────────────────────────────────────────────────────┘


DETALLE DE COMUNICACIÓN:

┌──────────────────┐
│   FRONTEND       │
│ MarketMakerContext│
└────────┬─────────┘
         │
         │ useEffect(() => {
         │   refreshData();
         │   setInterval(refreshData, 5000);
         │ }, []);
         │
         ▼
┌──────────────────┐
│ fetch()          │
│ GET /api/v1/...  │
└────────┬─────────┘
         │
         │ HTTP Request
         │
         ▼
┌──────────────────────────────────────┐
│ BACKEND                              │
│                                      │
│ @app.get("/api/v1/market-data")      │
│ async def get_market_data():         │
│   # Fetch de MultiExchangeManager   │
│   return market_data                 │
└────────┬─────────────────────────────┘
         │
         │ async calls
         │
         ▼
┌──────────────────────────────────────┐
│ MultiExchangeManager                 │
│                                      │
│ for exchange in exchanges:           │
│   tickers = await fetch_tickers()    │
│   positions = await fetch_positions()│
└────────┬─────────────────────────────┘
         │
         │ CCXT API calls
         │
         ▼
┌──────────────────────────────────────┐
│ EXCHANGE API                         │
│ (Binance/KuCoin/etc)                 │
│                                      │
│ Returns: JSON data                   │
└────────┬─────────────────────────────┘
         │
         │ Response
         │
         ▼
┌──────────────────────────────────────┐
│ BACKEND                              │
│ Process & Format data                │
│ {                                    │
│   symbol, price, volume,             │
│   spread, volatility, etc.           │
│ }                                    │
└────────┬─────────────────────────────┘
         │
         │ JSON Response
         │
         ▼
┌──────────────────────────────────────┐
│ FRONTEND                             │
│ setMarketData(data)                  │
│ Re-render components                 │
└──────────────────────────────────────┘


EJEMPLO ESPECÍFICO - KUCOIN TEST:

┌──────────────────┐
│ KuCoinTest.tsx   │
│ Component        │
└────────┬─────────┘
         │
         │ onClick runTests()
         │
         ▼
┌──────────────────────────────────────┐
│ makeKuCoinRequest(testType, params)  │
│                                      │
│ POST /api/kucoin-test-proxy          │
│ body: { testType, params }           │
└────────┬─────────────────────────────┘
         │
         │ Proxy request
         │ (evita CORS)
         │
         ▼
┌──────────────────────────────────────┐
│ BACKEND                              │
│ @app.post("/api/kucoin-test-proxy")  │
│                                      │
│ 1. Get credentials from secrets     │
│ 2. Create ExchangeWrapper           │
│ 3. Call exchange method             │
└────────┬─────────────────────────────┘
         │
         │ CCXT call
         │
         ▼
┌──────────────────────────────────────┐
│ ExchangeWrapper                      │
│                                      │
│ if testType == "accountOverview":    │
│   result = await fetch_balance()     │
│ elif testType == "btcTicker":        │
│   result = await fetch_ticker(BTC)   │
└────────┬─────────────────────────────┘
         │
         │ HTTPS + Signature
         │
         ▼
┌──────────────────────────────────────┐
│ KUCOIN API                           │
│ api-futures.kucoin.com               │
│                                      │
│ Verifica signature                   │
│ Returns data                         │
└────────┬─────────────────────────────┘
         │
         │ JSON Response
         │
         ▼
┌──────────────────────────────────────┐
│ BACKEND                              │
│ {                                    │
│   success: true,                     │
│   data: {...},                       │
│   testType: "accountOverview"        │
│ }                                    │
└────────┬─────────────────────────────┘
         │
         │ Return to frontend
         │
         ▼
┌──────────────────────────────────────┐
│ KuCoinTest.tsx                       │
│                                      │
│ Display results:                     │
│ ✅ Account Overview - Balance: $XXX  │
│ ✅ BTC Ticker - Price: $XX,XXX       │
└──────────────────────────────────────┘
```

---

## 5️⃣ FLUJO DE MULTI-EXCHANGE

```
┌─────────────────────────────────────────────────────────────┐
│           MULTI-EXCHANGE MANAGER DECISION FLOW               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  Necesito operar en    │
              │  símbolo: BTC/USDT     │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │  ¿Qué estrategia?      │
              └───────────┬────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   FAILOVER   │  │LOAD BALANCE  │  │BEST EXECUTION│
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       │                 │                 │
       ▼                 ▼                 ▼
┌────────────────────────────────────────────────┐
│            FAILOVER STRATEGY                   │
└──────────────────────────┬─────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ Orden de prioridad:    │
              │ 1. Binance            │
              │ 2. KuCoin             │
              │ 3. OKX                │
              │ 4. Bybit              │
              │ 5. Gate.io            │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Verificar Exchange #1:│
              │ Binance               │
              └───────────┬────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ▼                   ▼
         ┌────────────┐      ┌────────────┐
         │  Healthy?  │      │   Down?    │
         │   TRUE     │      │   FALSE    │
         └──────┬─────┘      └──────┬─────┘
                │                   │
                ▼                   ▼
         ┌────────────┐      ┌────────────┐
         │  Soporta   │      │   Probar   │
         │  símbolo?  │      │  Exchange  │
         │   TRUE     │      │    #2      │
         └──────┬─────┘      └──────┬─────┘
                │                   │
                ▼                   ▼
         ┌────────────┐      ┌────────────┐
         │   USAR     │      │  KuCoin    │
         │  BINANCE   │      │  Healthy?  │
         └────────────┘      └──────┬─────┘
                                    │
                          ┌─────────┴─────────┐
                          │                   │
                          ▼                   ▼
                   ┌────────────┐      ┌────────────┐
                   │   USAR     │      │   Probar   │
                   │  KUCOIN    │      │  Exchange  │
                   └────────────┘      │    #3...   │
                                       └────────────┘


┌────────────────────────────────────────────────┐
│         LOAD BALANCE STRATEGY                  │
└──────────────────────────┬─────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ Pesos configurados:    │
              │ Binance: 40%          │
              │ KuCoin: 25%           │
              │ OKX: 20%              │
              │ Bybit: 10%            │
              │ Gate: 5%              │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Filtrar solo:          │
              │ - Exchanges healthy    │
              │ - Que soporten símbolo │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Candidates:            │
              │ [Binance, KuCoin, OKX] │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Ordenar por peso       │
              │ descendente            │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Seleccionar primero:   │
              │ BINANCE (mayor peso)   │
              └────────────────────────┘


┌────────────────────────────────────────────────┐
│         BEST EXECUTION STRATEGY                │
└──────────────────────────┬─────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ Para cada exchange:    │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Calcular score:        │
              │                        │
              │ score = success_rate * │
              │         100 -          │
              │         latency_ms/10  │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Ejemplos:              │
              │                        │
              │ Binance:               │
              │  99% * 100 - 50/10 = 94│
              │                        │
              │ KuCoin:                │
              │  95% * 100 - 100/10 = 85│
              │                        │
              │ OKX:                   │
              │  98% * 100 - 80/10 = 90│
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Ordenar por score      │
              │ descendente            │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │ Seleccionar:           │
              │ BINANCE (score: 94)    │
              └────────────────────────┘


HEALTH CHECK DE EXCHANGES:

┌────────────────────────┐
│   Health Monitor       │
│   (cada 30 segundos)   │
└──────────┬─────────────┘
           │
           │ Para cada exchange
           ▼
┌────────────────────────┐
│ Medir tiempo inicio    │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ await fetch_balance()  │
│ (simple ping)          │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ Medir tiempo fin       │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ latency = fin - inicio │
└──────────┬─────────────┘
           │
  ┌────────┴────────┐
  │                 │
  ▼                 ▼
┌──────┐        ┌──────┐
│SUCCESS│        │ERROR │
└───┬──┘        └───┬──┘
    │               │
    ▼               ▼
┌────────────────────────┐
│ Actualizar Health:     │
│                        │
│ SUCCESS:               │
│ - connected = true     │
│ - latency_ms = X       │
│ - error_count -= 1     │
│ - success_rate += 0.1  │
│                        │
│ ERROR:                 │
│ - connected = false    │
│ - error_count += 1     │
│ - success_rate -= 0.2  │
└────────────────────────┘
```

---

## 📊 MÉTRICAS Y MONITOREO

```
┌─────────────────────────────────────────────────────────────┐
│                    METRICS COLLECTION                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  FINANCIALS  │  │ OPERATIONAL  │  │  TECHNICAL   │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       ▼                 ▼                 ▼
   Equity           Open Orders      Latency
   Total PnL        Positions        Error Rate
   Daily PnL        Fills/min        API Calls
   Fees Paid        Volume           Success Rate
   Sharpe Ratio     Spread           Uptime
                    
       │                 │                 │
       └─────────────────┼─────────────────┘
                         │
                         ▼
              ┌────────────────────┐
              │  Aggregate &       │
              │  Store in Memory   │
              └──────────┬─────────┘
                         │
                         ▼
              ┌────────────────────┐
              │  Si Prometheus     │
              │  enabled:          │
              │  Export metrics    │
              └──────────┬─────────┘
                         │
                         ▼
              ┌────────────────────┐
              │  Update Frontend   │
              │  via API           │
              └────────────────────┘
```

---

**Documento Técnico Generado:** 2025-10-01  
**Versión del Sistema:** MarketMaker Pro 4.2

