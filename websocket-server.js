import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:5173", "https://localhost:5173"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

const PORT = process.env.PORT || 8000;

// Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Middleware
app.use(cors({
    origin: ["http://localhost:5173", "https://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Logger
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

// Store for real-time data
const realtimeData = {
    trades: [],
    orders: [],
    positions: [],
    metrics: {
        equity: 0,
        totalPnl: 0,
        dailyPnl: 0,
        openOrders: 0,
        openPositions: 0
    }
};

// WebSocket connection handling
io.on('connection', (socket) => {
    log(`Client connected: ${socket.id}`);

    // Send initial data
    socket.emit('initial_data', {
        trades: realtimeData.trades,
        orders: realtimeData.orders,
        positions: realtimeData.positions,
        metrics: realtimeData.metrics
    });

    // Subscribe to specific channels
    socket.on('subscribe', (channel) => {
        log(`Client ${socket.id} subscribed to ${channel}`);
        socket.join(channel);
    });

    socket.on('unsubscribe', (channel) => {
        log(`Client ${socket.id} unsubscribed from ${channel}`);
        socket.leave(channel);
    });

    socket.on('disconnect', () => {
        log(`Client disconnected: ${socket.id}`);
    });
});

// Function to broadcast updates
function broadcastUpdate(channel, event, data) {
    io.to(channel).emit(event, data);
    log(`Broadcast to ${channel}: ${event}`);
}

// Function to emit to all clients
function broadcastToAll(event, data) {
    io.emit(event, data);
}

// Supabase real-time subscriptions
if (supabase) {
    log('Setting up Supabase real-time subscriptions...');

    // Subscribe to trades
    supabase
        .channel('trades_channel')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'trades' },
            (payload) => {
                log(`Trade update: ${payload.eventType}`);

                if (payload.eventType === 'INSERT') {
                    realtimeData.trades.unshift(payload.new);
                    if (realtimeData.trades.length > 100) {
                        realtimeData.trades = realtimeData.trades.slice(0, 100);
                    }
                    broadcastToAll('trade_created', payload.new);
                } else if (payload.eventType === 'UPDATE') {
                    const index = realtimeData.trades.findIndex(t => t.id === payload.new.id);
                    if (index !== -1) {
                        realtimeData.trades[index] = payload.new;
                    }
                    broadcastToAll('trade_updated', payload.new);
                }
            }
        )
        .subscribe();

    // Subscribe to orders
    supabase
        .channel('orders_channel')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            (payload) => {
                log(`Order update: ${payload.eventType}`);

                if (payload.eventType === 'INSERT') {
                    realtimeData.orders.unshift(payload.new);
                    if (realtimeData.orders.length > 100) {
                        realtimeData.orders = realtimeData.orders.slice(0, 100);
                    }
                    realtimeData.metrics.openOrders = realtimeData.orders.filter(o =>
                        o.status === 'open' || o.status === 'pending'
                    ).length;
                    broadcastToAll('order_created', payload.new);
                    broadcastToAll('metrics_updated', realtimeData.metrics);
                } else if (payload.eventType === 'UPDATE') {
                    const index = realtimeData.orders.findIndex(o => o.id === payload.new.id);
                    if (index !== -1) {
                        realtimeData.orders[index] = payload.new;
                    }
                    realtimeData.metrics.openOrders = realtimeData.orders.filter(o =>
                        o.status === 'open' || o.status === 'pending'
                    ).length;
                    broadcastToAll('order_updated', payload.new);
                    broadcastToAll('metrics_updated', realtimeData.metrics);
                }
            }
        )
        .subscribe();

    // Subscribe to positions
    supabase
        .channel('positions_channel')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'positions' },
            (payload) => {
                log(`Position update: ${payload.eventType}`);

                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    const index = realtimeData.positions.findIndex(p => p.id === payload.new.id);
                    if (index !== -1) {
                        realtimeData.positions[index] = payload.new;
                    } else {
                        realtimeData.positions.push(payload.new);
                    }

                    // Update metrics
                    realtimeData.metrics.openPositions = realtimeData.positions.filter(p => p.is_open).length;
                    const totalPnl = realtimeData.positions.reduce((sum, p) =>
                        sum + (p.unrealized_pnl || 0) + (p.realized_pnl || 0), 0
                    );
                    realtimeData.metrics.totalPnl = totalPnl;

                    broadcastToAll('position_updated', payload.new);
                    broadcastToAll('metrics_updated', realtimeData.metrics);
                }
            }
        )
        .subscribe();

    // Subscribe to system metrics
    supabase
        .channel('metrics_channel')
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'system_metrics' },
            (payload) => {
                log('System metrics updated');
                realtimeData.metrics = {
                    equity: payload.new.equity,
                    totalPnl: payload.new.total_pnl,
                    dailyPnl: payload.new.daily_pnl,
                    openOrders: payload.new.open_orders,
                    openPositions: payload.new.open_positions,
                    healthyExchanges: payload.new.healthy_exchanges,
                    openCircuits: payload.new.open_circuits,
                    riskMode: payload.new.risk_mode
                };
                broadcastToAll('metrics_updated', realtimeData.metrics);
            }
        )
        .subscribe();

    log('Supabase real-time subscriptions active');
} else {
    log('Warning: Supabase not configured - real-time updates disabled');
}

// REST API Endpoints
app.get('/', (req, res) => {
    res.json({
        message: "MarketMaker Pro WebSocket API",
        version: "4.2",
        status: "Node.js Backend with WebSocket",
        websocket: true,
        supabase: supabase !== null
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: "healthy",
        timestamp: Date.now(),
        backend: "Node.js",
        websocket: io.engine.clientsCount,
        supabase: supabase !== null
    });
});

app.get('/api/test', (req, res) => {
    const kucoinConfig = secrets?.exchanges?.kucoin || {};
    res.json({
        status: "API is working",
        timestamp: Date.now(),
        kucoin_configured: !!(kucoinConfig.api_key && kucoinConfig.api_secret && kucoinConfig.passphrase),
        backend: "Node.js",
        websocket: true,
        connected_clients: io.engine.clientsCount
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

app.get('/api/v1/kucoin/symbols', async (req, res) => {
    try {
        const kucoinConfig = secrets?.exchanges?.kucoin || {};

        if (!kucoinConfig.api_key || !kucoinConfig.api_secret || !kucoinConfig.passphrase) {
            return res.json({
                success: false,
                error: "KuCoin credentials not configured"
            });
        }

        const result = await makeKuCoinAPICall('symbols', {}, kucoinConfig);

        res.json({
            success: result.success,
            symbols: result.data,
            error: result.error
        });

    } catch (error) {
        log(`KuCoin symbols error: ${error.message}`);
        res.json({
            success: false,
            error: error.message
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
httpServer.listen(PORT, '0.0.0.0', () => {
    log(`MarketMaker Pro WebSocket API running on http://localhost:${PORT}`);
    log("Backend: Node.js with Socket.IO");
    log(`Supabase: ${supabase ? 'Connected' : 'Not configured'}`);
    log("Available endpoints:");
    log("  GET  / - API info");
    log("  GET  /health - Health check");
    log("  GET  /api/test - Test endpoint");
    log("  GET  /api/kucoin-credentials-check - Check credentials");
    log("  POST /api/kucoin-test-proxy - KuCoin test proxy");
    log("  GET  /api/v1/kucoin/symbols - Get KuCoin symbols");
    log("  GET  /config - Configuration");
    log("  WebSocket: Real-time updates enabled");
});
