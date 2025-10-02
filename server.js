import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
    origin: ["http://localhost:5173", "https://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Simple logger
const log = (message) => {
    console.log(`[${new Date().toISOString()}] ${message}`);
};

// Load configuration
function loadConfig() {
    let config = {};
    let secrets = {};
    
    try {
        if (fs.existsSync('config.json')) {
            config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
        }
    } catch (e) {
        log(`Warning: Could not load config.json: ${e.message}`);
    }
    
    try {
        if (fs.existsSync('secrets.json')) {
            secrets = JSON.parse(fs.readFileSync('secrets.json', 'utf8'));
        }
    } catch (e) {
        log(`Warning: Could not load secrets.json: ${e.message}`);
    }
    
    // Override with environment variables
    const kucoinKey = process.env.KUCOIN_API_KEY;
    const kucoinSecret = process.env.KUCOIN_API_SECRET;
    const kucoinPassphrase = process.env.KUCOIN_PASSPHRASE;
    
    if (kucoinKey && kucoinSecret && kucoinPassphrase) {
        if (!secrets.exchanges) secrets.exchanges = {};
        if (!secrets.exchanges.kucoin) secrets.exchanges.kucoin = {};
        secrets.exchanges.kucoin.api_key = kucoinKey;
        secrets.exchanges.kucoin.api_secret = kucoinSecret;
        secrets.exchanges.kucoin.passphrase = kucoinPassphrase;
    }
    
    return { config, secrets };
}

const { config, secrets } = loadConfig();

// Real KuCoin API integration
async function makeKuCoinAPICall(testType, params, config) {
    const crypto = await import('crypto');
    
    const baseUrl = 'https://api-futures.kucoin.com';
    const timestamp = Date.now().toString();
    
    try {
        let endpoint, method = 'GET', body = '';
        
        switch (testType) {
            case 'accountOverview':
                endpoint = '/api/v1/account-overview';
                break;
            case 'accounts':
                endpoint = '/api/v1/accounts';
                break;
            case 'symbols':
                endpoint = '/api/v1/contracts/active';
                break;
            case 'btcTicker':
                endpoint = '/api/v1/ticker?symbol=XBTUSDTM';
                break;
            default:
                return { success: false, error: `Unknown test type: ${testType}` };
        }
        
        // Create signature
        const message = timestamp + method + endpoint + body;
        const signature = crypto.createHmac('sha256', config.api_secret)
            .update(message)
            .digest('base64');
            
        const passphraseSignature = crypto.createHmac('sha256', config.api_secret)
            .update(config.passphrase)
            .digest('base64');
        
        const headers = {
            'KC-API-KEY': config.api_key,
            'KC-API-SIGN': signature,
            'KC-API-TIMESTAMP': timestamp,
            'KC-API-PASSPHRASE': passphraseSignature,
            'KC-API-KEY-VERSION': '2',
            'Content-Type': 'application/json'
        };
        
        const response = await fetch(baseUrl + endpoint, {
            method,
            headers,
            timeout: 10000
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.code === '200000') {
            return { success: true, data: data.data };
        } else {
            return { success: false, error: `KuCoin API Error: ${data.msg || 'Unknown error'}` };
        }
        
    } catch (error) {
        log(`KuCoin API Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Routes
app.get('/', (req, res) => {
    res.json({
        message: "MarketMaker Pro API",
        version: "4.2",
        status: "Node.js Backend"
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: "healthy",
        timestamp: Date.now(),
        backend: "Node.js"
    });
});

app.get('/api/test', (req, res) => {
    const kucoinConfig = secrets?.exchanges?.kucoin || {};
    res.json({
        status: "API is working",
        timestamp: Date.now(),
        kucoin_configured: !!(kucoinConfig.api_key && kucoinConfig.api_secret && kucoinConfig.passphrase),
        backend: "Node.js"
    });
});

app.get('/api/kucoin-credentials-check', (req, res) => {
    const kucoinConfig = secrets?.exchanges?.kucoin || {};
    
    res.json({
        api_key_configured: !!kucoinConfig.api_key,
        api_secret_configured: !!kucoinConfig.api_secret,
        passphrase_configured: !!kucoinConfig.passphrase,
        api_key_preview: kucoinConfig.api_key ? kucoinConfig.api_key.substring(0, 8) + "..." : "Not configured",
        all_configured: !!(kucoinConfig.api_key && kucoinConfig.api_secret && kucoinConfig.passphrase)
    });
});

// Endpoint para verificar conexión real con KuCoin
app.get('/api/kucoin-connection-test', async (req, res) => {
    try {
        const kucoinConfig = secrets?.exchanges?.kucoin || {};
        
        if (!kucoinConfig.api_key || !kucoinConfig.api_secret || !kucoinConfig.passphrase) {
            return res.json({
                connected: false,
                error: "Credenciales no configuradas",
                details: {
                    api_key: !!kucoinConfig.api_key,
                    api_secret: !!kucoinConfig.api_secret,
                    passphrase: !!kucoinConfig.passphrase
                }
            });
        }
        
        log('🔍 Probando conexión real con KuCoin...');
        
        // Hacer una petición simple para verificar conexión
        const result = await makeKuCoinAPICall('accountOverview', {}, kucoinConfig);
        
        if (result.success) {
            log('✅ KuCoin conectado exitosamente');
            res.json({
                connected: true,
                message: "Conexión exitosa con KuCoin",
                account_data: result.data,
                timestamp: new Date().toISOString()
            });
        } else {
            log('❌ Error de conexión con KuCoin:', result.error);
            res.json({
                connected: false,
                error: result.error,
                timestamp: new Date().toISOString()
            });
        }
        
    } catch (error) {
        log('💥 Error verificando conexión KuCoin:', error.message);
        res.json({
            connected: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.post('/api/kucoin-test-proxy', async (req, res) => {
    try {
        const { testType, params = {} } = req.body;
        log(`KuCoin test request: ${testType}`);
        
        const kucoinConfig = secrets?.exchanges?.kucoin || {};
        
        if (!kucoinConfig.api_key || !kucoinConfig.api_secret || !kucoinConfig.passphrase) {
            return res.json({
                success: false,
                error: "KuCoin credentials not configured",
                details: {
                    api_key: !!kucoinConfig.api_key,
                    api_secret: !!kucoinConfig.api_secret,
                    passphrase: !!kucoinConfig.passphrase
                },
                testType
            });
        }
        
        // Make real API call to KuCoin
        const result = await makeKuCoinAPICall(testType, params, kucoinConfig);
        
        res.json({
            success: result.success,
            data: result.data,
            error: result.error,
            testType,
            real_api: true
        });
        
    } catch (error) {
        log(`KuCoin test error: ${error.message}`);
        res.json({
            success: false,
            error: error.message,
            testType: req.body.testType
        });
    }
});

app.get('/config', (req, res) => {
    res.json({
        exchanges: [{ exchange: "kucoin" }],
        config: config
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    log(`Error: ${err.message}`);
    res.status(500).json({
        error: "Internal server error",
        message: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: "Not found",
        path: req.path
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    log(`MarketMaker Pro API running on http://localhost:${PORT}`);
    log("Backend: Node.js (avoiding Python installation issues)");
    log("Available endpoints:");
    log("  GET  / - API info");
    log("  GET  /health - Health check");
    log("  GET  /api/test - Test endpoint");
    log("  GET  /api/kucoin-credentials-check - Check credentials");
    log("  GET  /api/kucoin-connection-test - Test real KuCoin connection");
    log("  POST /api/kucoin-test-proxy - KuCoin test proxy");
    log("  GET  /config - Configuration");
});