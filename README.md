# 🚀 MarketMaker Pro

Un sistema avanzado de market making para criptomonedas con soporte multi-exchange y gestión de riesgo automatizada.

## ✨ Características

- 🔄 **Multi-Exchange**: Soporte para Binance, KuCoin, OKX, Bybit y más
- 📊 **Dashboard en Tiempo Real**: Interfaz moderna con métricas en vivo
- ⚡ **Gestión de Riesgo**: Circuit breakers y límites automáticos
- 🎯 **Backtesting**: Simulación histórica de estrategias
- 📈 **Métricas Avanzadas**: PnL, Sharpe ratio, drawdown tracking
- 🔐 **Seguridad**: Manejo seguro de credenciales API

## 🛠️ Tecnologías

### Frontend
- **React 18** con TypeScript
- **Tailwind CSS** para estilos
- **Lucide React** para iconos
- **Vite** como bundler

### Backend
- **Node.js** con Express
- **Python** con FastAPI (alternativo)
- **CCXT** para conexiones exchange
- **WebSocket** para datos en tiempo real

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/marketmaker-pro.git
cd marketmaker-pro
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:
```env
# KuCoin API
KUCOIN_API_KEY=tu_api_key
KUCOIN_API_SECRET=tu_api_secret
KUCOIN_PASSPHRASE=tu_passphrase

# Binance API
BINANCE_API_KEY=tu_api_key
BINANCE_API_SECRET=tu_api_secret

# Telegram Alerts
TELEGRAM_BOT_TOKEN=tu_bot_token
TELEGRAM_CHAT_ID=tu_chat_id
```

### 4. Iniciar el proyecto

#### Opción A: Backend Node.js (Recomendado)
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run dev
```

#### Opción B: Backend Python
```bash
# Terminal 1: Backend Python
python main.py

# Terminal 2: Frontend
npm run dev
```

## 📱 Uso

1. **Accede al dashboard**: `http://localhost:5173`
2. **Configura exchanges**: Ve a la pestaña "Exchanges"
3. **Prueba conexiones**: Usa "KuCoin Test" para verificar
4. **Configura riesgo**: Ajusta parámetros en "Risk Controls"
5. **Inicia trading**: Presiona "Start" en el header

## 🔧 Configuración

### Exchanges Soportados
- ✅ **KuCoin Futures** - Completamente integrado
- ✅ **Binance Futures** - En desarrollo
- 🔄 **OKX** - Próximamente
- 🔄 **Bybit** - Próximamente

### Modos de Riesgo
- **Conservative**: 1% margin, 1 nivel, límites estrictos
- **Aggressive**: 5% margin, 5 niveles, límites relajados  
- **Aggressive Plus**: 6% margin, 7 niveles, exposición máxima

## 📊 API Endpoints

### Backend Node.js (Puerto 8000)
```
GET  /                           - Info de la API
GET  /health                     - Estado del sistema
GET  /api/test                   - Test básico
GET  /api/kucoin-credentials-check - Verificar credenciales
POST /api/kucoin-test-proxy      - Proxy para pruebas KuCoin
```

### Frontend (Puerto 5173)
- Dashboard principal con métricas en tiempo real
- Gestión de posiciones y órdenes
- Panel de configuración avanzada
- Sistema de alertas y logs

## 🔐 Seguridad

- ✅ Credenciales nunca expuestas en el frontend
- ✅ Proxy backend para evitar CORS
- ✅ Validación de permisos API
- ✅ Rate limiting automático
- ✅ Circuit breakers para protección

## 🧪 Testing

### Probar KuCoin API
```bash
node test-kucoin-direct.js
```

### Ejecutar tests
```bash
npm test
```

## 📈 Métricas

El sistema trackea:
- **PnL Total y Diario**
- **Sharpe Ratio**
- **Maximum Drawdown**
- **Win Rate**
- **Latencia de APIs**
- **Tasa de Fill de Órdenes**

## 🚨 Alertas

Soporte para notificaciones via:
- 📱 **Telegram**
- 📧 **Email**
- 🔗 **Webhooks**

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## ⚠️ Disclaimer

Este software es para fines educativos y de investigación. El trading de criptomonedas conlleva riesgos significativos. Usa bajo tu propia responsabilidad.

## 📞 Soporte

- 🐛 **Issues**: [GitHub Issues](https://github.com/tu-usuario/marketmaker-pro/issues)
- 💬 **Discusiones**: [GitHub Discussions](https://github.com/tu-usuario/marketmaker-pro/discussions)
- 📧 **Email**: tu-email@ejemplo.com

---

⭐ **¡Dale una estrella si te gusta el proyecto!** ⭐