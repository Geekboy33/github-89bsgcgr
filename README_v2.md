# 🚀 MarketMaker Pro v4.2 - Versión Mejorada

## ✨ Nuevas Funcionalidades Implementadas

### 🎯 **Mejoras Críticas**
- ✅ Sistema de excepciones personalizadas
- ✅ Logging estructurado con JSON y colores
- ✅ Base de datos SQLAlchemy con persistencia completa
- ✅ Circuit Breakers funcionales con 5 tipos de protección
- ✅ Endpoints backend completamente funcionales
- ✅ Sistema de alertas Telegram integrado
- ✅ Componentes React optimizados con React.memo
- ✅ Manejo robusto de errores con retry logic

### 📊 **Nuevas Capacidades**
- 🔄 **Multi-Exchange Real**: Binance, KuCoin, OKX, Bybit, Gate.io
- 🛡️ **Circuit Breakers**: Latencia, Spread, Volatilidad, Error Rate, Drawdown
- 📱 **Alertas Telegram**: Notificaciones en tiempo real de eventos
- 💾 **Persistencia**: Todos los trades, posiciones y métricas se guardan
- 📈 **Historial Completo**: Consulta histórica de trades y circuit breakers
- ⚡ **Performance Optimizado**: React.memo, useMemo, useCallback

---

## 📋 Requisitos Previos

- **Python 3.8+** (con pip)
- **Node.js 16+** (con npm)
- **PostgreSQL** (opcional, usa SQLite por defecto)

---

## 🔧 Instalación Rápida

### Opción 1: Instalación Automática (Recomendado)

#### Windows:
```bash
install.bat
```

#### Linux/Mac:
```bash
chmod +x install.sh
./install.sh
```

### Opción 2: Instalación Manual

#### 1. Instalar dependencias Python
```bash
pip install -r requirements.txt
```

#### 2. Instalar dependencias Node.js
```bash
npm install
```

#### 3. Configurar credenciales

Crea un archivo `.env` en la raíz del proyecto:

```env
# KuCoin
KUCOIN_API_KEY=tu_api_key
KUCOIN_API_SECRET=tu_api_secret
KUCOIN_PASSPHRASE=tu_passphrase

# Binance
BINANCE_API_KEY=tu_api_key
BINANCE_API_SECRET=tu_api_secret

# Telegram (opcional)
TELEGRAM_BOT_TOKEN=tu_bot_token
TELEGRAM_CHAT_ID=tu_chat_id

# Database (opcional)
DATABASE_URL=sqlite:///./marketmaker.db
```

O crea `secrets.json`:

```json
{
  "exchanges": {
    "kucoin": {
      "api_key": "tu_api_key",
      "api_secret": "tu_api_secret",
      "passphrase": "tu_passphrase"
    },
    "binance": {
      "api_key": "tu_api_key",
      "api_secret": "tu_api_secret"
    }
  },
  "alerts": {
    "telegram": {
      "bot_token": "tu_bot_token",
      "chat_id": "tu_chat_id"
    }
  }
}
```

---

## 🚀 Ejecutar el Sistema

### Backend (Python/FastAPI) - NUEVO Y MEJORADO
```bash
python main_v2.py
```

El backend estará disponible en: `http://localhost:8000`

### Frontend (React/Vite)
```bash
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

---

## 📡 Nuevos Endpoints API

### **Market Data**
```http
GET /api/v1/market-data           # Datos de mercado en tiempo real
GET /api/v1/orderbook/{symbol}    # Order book de un símbolo
```

### **Posiciones**
```http
GET  /api/v1/positions              # Todas las posiciones abiertas
POST /api/v1/positions/{symbol}/close  # Cerrar posición
```

### **Órdenes**
```http
GET  /api/v1/orders                 # Todas las órdenes abiertas
POST /api/v1/orders/create          # Crear nueva orden
POST /api/v1/orders/{id}/cancel     # Cancelar orden
```

### **Métricas**
```http
GET /api/v1/metrics                 # Métricas del sistema
GET /api/v1/system/status           # Estado completo del sistema
PUT /api/v1/risk/mode               # Cambiar modo de riesgo
```

### **Historial**
```http
GET /api/v1/history/trades          # Historial de trades
GET /api/v1/history/circuit-breakers # Historial de circuit breakers
```

---

## 🛡️ Circuit Breakers

El sistema incluye 5 tipos de circuit breakers que protegen automáticamente:

### 1. **Latency Breaker**
- Threshold: 500ms
- Se abre si la latencia es muy alta
- Protege contra exchanges lentos

### 2. **Spread Breaker**
- Threshold: 20 bps (0.2%)
- Se abre si el spread es anormal
- Protege contra falta de liquidez

### 3. **Volatility Breaker**
- Threshold: 5%
- Se abre si la volatilidad es extrema
- Protege durante eventos de mercado

### 4. **Error Rate Breaker**
- Threshold: 10%
- Se abre si hay muchos errores
- Protege contra problemas de API

### 5. **Drawdown Breaker**
- Threshold: 100 bps (1%)
- Se abre si hay pérdidas grandes
- Protege el capital

**Configuración** en `config.yaml`:
```yaml
latency_threshold_ms: 500
spread_threshold_bps: 20
volatility_threshold: 0.05
error_rate_threshold: 0.1
drawdown_threshold_bps: 100
circuit_cooldown_seconds: 300  # 5 minutos
```

---

## 📱 Alertas Telegram

### Configuración

1. Crea un bot con [@BotFather](https://t.me/BotFather)
2. Obtén el token del bot
3. Obtén tu chat_id enviando un mensaje al bot y visitando:
   ```
   https://api.telegram.org/bot<TU_TOKEN>/getUpdates
   ```
4. Configura en `.env` o `secrets.json`

### Tipos de Alertas

- 🚨 **Critical**: Errores graves, pérdidas grandes
- ❌ **Error**: Errores del sistema
- ⚠️ **Warning**: Circuit breakers, desconexiones
- ℹ️ **Info**: Inicio/parada, posiciones abiertas/cerradas

---

## 💾 Base de Datos

### SQLite (Por Defecto)
El sistema usa SQLite por defecto. No requiere configuración.

### PostgreSQL (Producción)
Para usar PostgreSQL en producción:

```env
DATABASE_URL=postgresql://user:password@localhost/marketmaker
```

### Tablas Creadas
- `trades`: Historial de trades
- `positions`: Posiciones (abiertas y cerradas)
- `system_metrics`: Métricas del sistema
- `circuit_breaker_events`: Eventos de circuit breakers
- `exchange_health`: Salud de exchanges
- `alerts`: Alertas enviadas
- `balance_snapshots`: Snapshots de balance

---

## 📊 Logging

### Estructura de Logs

**Console** (legible con colores):
```
2025-10-01 10:30:45 | INFO     | exchange_manager     | ✅ Connected to binance
```

**Archivo** (JSON estructurado):
```json
{
  "timestamp": "2025-10-01T10:30:45.123Z",
  "level": "INFO",
  "logger": "exchange_manager",
  "message": "Connected to binance",
  "exchange": "binance"
}
```

### Archivos de Log
- `logs/main.log`: Log principal
- `logs/exchanges.log`: Logs de exchanges
- `logs/multi_exchange.log`: Gestor multi-exchange
- `logs/circuit_breaker.log`: Circuit breakers
- `logs/alerts.log`: Alertas enviadas

---

## 🎯 Modos de Riesgo

### Conservative (Bajo Riesgo)
- Margin: 1%
- Ladder levels: 1
- Max inventory: $10,000/símbolo

### Aggressive (Riesgo Medio)
- Margin: 5%
- Ladder levels: 5
- Max inventory: $50,000/símbolo

### Aggressive Plus (Alto Riesgo)
- Margin: 6%
- Ladder levels: 7
- Max inventory: $50,000/símbolo

**Cambiar modo via API**:
```bash
curl -X PUT http://localhost:8000/api/v1/risk/mode \
  -H "Content-Type: application/json" \
  -d '{"mode": "aggressive"}'
```

---

## 🧪 Testing

### Test de Conexión KuCoin
```bash
# Via API
curl http://localhost:8000/api/kucoin-credentials-check

# Via Frontend
Visitar: http://localhost:5173 → KuCoin Test
```

### Health Check
```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/system/status
```

---

## 📁 Estructura del Proyecto (Actualizada)

```
marketmaker-pro1/
├── core/                      # 🆕 Módulos core
│   ├── alerts.py             # 🆕 Sistema de alertas
│   ├── circuit_breaker.py    # 🆕 Circuit breakers
│   ├── database.py           # 🆕 Base de datos
│   ├── exceptions.py         # 🆕 Excepciones
│   ├── logger.py             # 🆕 Logging mejorado
│   ├── config_schema.py      # 🆕 Validación config
│   └── utils.py              # Utilidades
├── exchanges/                 # Integraciones exchanges
│   ├── exchange_factory.py   # ✨ Mejorado con errores
│   └── multi_exchange_manager.py # ✨ Con circuit breakers
├── src/                       # Frontend React
│   ├── components/           
│   │   ├── Dashboard.tsx     # ✨ Optimizado con memo
│   │   └── ...
│   └── context/
│       └── MarketMakerContext.tsx
├── logs/                      # 🆕 Archivos de log
├── config/                    
│   └── config.yaml           # Configuración completa
├── config.json               # Config simplificado
├── secrets.json              # 🆕 Credenciales (gitignored)
├── .env                      # 🆕 Variables de entorno
├── main_v2.py                # 🆕 Backend mejorado
├── requirements.txt          # ✨ Actualizado
├── package.json              # ✨ Actualizado
├── marketmaker.db            # 🆕 Base de datos SQLite
└── README_v2.md              # 🆕 Este archivo
```

---

## 🔧 Troubleshooting

### Error: "System not initialized"
**Solución**: El backend aún se está inicializando. Espera 10-15 segundos.

### Error: "KuCoin credentials not configured"
**Solución**: Verifica que `.env` o `secrets.json` tengan las credenciales correctas.

### Error: "Circuit breaker opened"
**Solución**: Es protección automática. Espera el cooldown (5 min) o cierra manualmente:
```python
# En Python console
from main_v2 import multi_exchange_manager
multi_exchange_manager.circuit_breaker_manager.close_all()
```

### Las alertas no llegan a Telegram
**Solución**:
1. Verifica el token y chat_id
2. Activa alertas en config: `alerts.enabled: true`
3. Verifica logs: `logs/alerts.log`

---

## 📚 Documentación Adicional

- **Análisis Completo**: `ANALISIS_SISTEMA_COMPLETO.md`
- **Diagramas Técnicos**: `DIAGRAMAS_FLUJO_TECNICO.md`
- **Referencia API**: `REFERENCIA_FUNCIONALIDADES.md`
- **Mejoras Implementadas**: `MEJORAS_RECOMENDADAS.md`

---

## 🎉 Características Destacadas

### ✅ **Lo Mejor del Sistema**
1. **Circuit Breakers Automáticos** - Protección 24/7
2. **Multi-Exchange Real** - Failover automático
3. **Persistencia Completa** - Nunca pierdas datos
4. **Alertas Inteligentes** - Notificaciones importantes
5. **Logging Profesional** - Debug fácil
6. **Performance Optimizado** - UI fluida
7. **Manejo de Errores Robusto** - Retry automático
8. **API Completa** - Todos los endpoints funcionales

### 🚀 **Ventajas Competitivas**
- ✅ **5 Exchanges** soportados (Binance, KuCoin, OKX, Bybit, Gate)
- ✅ **3 Estrategias** de selección de exchange
- ✅ **5 Circuit Breakers** de protección
- ✅ **Historial completo** en base de datos
- ✅ **Telegram integrado** para alertas
- ✅ **Código limpio** y bien documentado

---

## 🛠️ Desarrollo

### Agregar Nuevo Exchange
1. Agregar en `ExchangeFactory.SUPPORTED_EXCHANGES`
2. Implementar lógica específica en `_create_exchange()`
3. Configurar en `config.yaml`
4. Agregar credenciales en `secrets.json`

### Agregar Nuevo Endpoint
1. Definir en `main_v2.py`
2. Agregar modelos Pydantic si es necesario
3. Implementar lógica con manejo de errores
4. Documentar en este README

### Ejecutar Tests
```bash
# TODO: Implementar tests
pytest tests/ -v --cov=.
```

---

## 📝 Changelog

### v4.2 (2025-10-01)
- ✅ Implementadas TODAS las mejoras críticas
- ✅ Sistema de Circuit Breakers funcional
- ✅ Base de datos con SQLAlchemy
- ✅ Alertas Telegram integradas
- ✅ Logging estructurado
- ✅ Manejo robusto de errores
- ✅ Endpoints API completos
- ✅ Performance optimizado
- ✅ Documentación completa

---

## 👨‍💻 Soporte

Para problemas o preguntas:
1. Revisa los logs en `logs/`
2. Consulta la documentación
3. Verifica la configuración

---

## 📄 Licencia

MIT License - Úsalo libremente para tus proyectos

---

**¡Sistema listo para trading profesional!** 🚀💰

