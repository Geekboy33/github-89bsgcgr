"""
MarketMaker Pro v4.2 - Backend API con todas las mejoras implementadas
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import os
import json
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime
from sqlalchemy.orm import Session

# Core modules
from core.logger import get_logger
from core.database import get_db, Trade, Position, SystemMetric, CircuitBreakerEvent, init_db
from core.exceptions import ExchangeConnectionError, InsufficientBalanceError, InvalidOrderError
from core.config_schema import validate_config
from exchanges.exchange_factory import ExchangeFactory
from exchanges.multi_exchange_manager import MultiExchangeManager

# Initialize logger
logger = get_logger("main", "main.log")

# Global instances
multi_exchange_manager: Optional[MultiExchangeManager] = None
app_config: Dict = {}
app_secrets: Dict = {}


class KuCoinTestRequest(BaseModel):
    testType: str
    params: dict = {}


class OrderCreateRequest(BaseModel):
    symbol: str
    side: str  # buy/sell
    type: str  # limit/market
    amount: float
    price: Optional[float] = None


class RiskModeUpdate(BaseModel):
    mode: str  # conservative/aggressive/aggressive_plus


def load_config():
    """Load configuration from config.json with .env overrides"""
    config_path = Path("config.json")
    if not config_path.exists():
        logger.error("config.json not found")
        raise FileNotFoundError("config.json not found")
    
    with open(config_path, 'r') as f:
        cfg = json.load(f)
    
    # Validate config
    cfg = validate_config(cfg)
    
    # Load secrets from secrets.json
    secrets_path = Path("secrets.json")
    secrets = {}
    if secrets_path.exists():
        with open(secrets_path, 'r') as f:
            secrets = json.load(f)
            logger.info("Secrets loaded from secrets.json")
    
    # Override with .env values
    from dotenv import load_dotenv
    load_dotenv()
    
    # Binance overrides
    binance_key = os.getenv("BINANCE_API_KEY")
    binance_secret = os.getenv("BINANCE_API_SECRET")
    if binance_key and binance_secret:
        secrets.setdefault("exchanges", {}).setdefault("binance", {})
        secrets["exchanges"]["binance"]["api_key"] = binance_key
        secrets["exchanges"]["binance"]["api_secret"] = binance_secret
        logger.info("Binance credentials loaded from .env")
    
    # Bybit overrides
    bybit_key = os.getenv("BYBIT_API_KEY")
    bybit_secret = os.getenv("BYBIT_API_SECRET")
    if bybit_key and bybit_secret:
        secrets.setdefault("exchanges", {}).setdefault("bybit", {})
        secrets["exchanges"]["bybit"]["api_key"] = bybit_key
        secrets["exchanges"]["bybit"]["api_secret"] = bybit_secret
        logger.info("Bybit credentials loaded from .env")
    
    # Telegram overrides
    tg_token = os.getenv("TELEGRAM_BOT_TOKEN")
    tg_chat  = os.getenv("TELEGRAM_CHAT_ID")
    if tg_token and tg_chat:
        secrets.setdefault("alerts", {}).setdefault("telegram", {})
        secrets["alerts"]["telegram"]["bot_token"] = tg_token
        secrets["alerts"]["telegram"]["chat_id"] = tg_chat
        logger.info("Telegram credentials loaded from .env")

    # KuCoin overrides
    kucoin_key = os.getenv("KUCOIN_API_KEY")
    kucoin_secret = os.getenv("KUCOIN_API_SECRET")
    kucoin_passphrase = os.getenv("KUCOIN_PASSPHRASE")
    if kucoin_key and kucoin_secret and kucoin_passphrase:
        secrets.setdefault("exchanges", {}).setdefault("kucoin", {})
        secrets["exchanges"]["kucoin"]["api_key"] = kucoin_key
        secrets["exchanges"]["kucoin"]["api_secret"] = kucoin_secret
        secrets["exchanges"]["kucoin"]["passphrase"] = kucoin_passphrase
        logger.info("KuCoin credentials loaded from .env")

    logger.info("Configuration loaded successfully")
    
    return cfg, secrets


from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    global multi_exchange_manager
    
    # Startup
    logger.info("Starting MarketMaker Pro v4.2...")
    
    # Initialize database
    init_db()
    logger.info("Database initialized")
    
    # Create multi-exchange manager
    logger.info("Creating multi-exchange manager...")
    multi_exchange_manager = MultiExchangeManager(app_config, app_secrets)

    logger.info("Initializing multi-exchange manager...")
    try:
        await multi_exchange_manager.initialize()
        logger.info(f"Multi-exchange manager initialized with {len(multi_exchange_manager.exchanges)} exchanges")
        logger.info(f"Available exchanges: {list(multi_exchange_manager.exchanges.keys())}")
    except Exception as e:
        logger.error(f"Failed to initialize multi-exchange manager: {str(e)}")
        logger.error(f"Exception type: {type(e).__name__}")
        raise
    
    # Start health monitoring in background
    asyncio.create_task(multi_exchange_manager.start_health_monitoring())
    logger.info("Health monitoring started")
    
    # Send startup alert
    await multi_exchange_manager.alert_manager.alert_system_startup("4.2")
    
    logger.info("MarketMaker Pro started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down MarketMaker Pro...")
    
    if multi_exchange_manager:
        await multi_exchange_manager.alert_manager.alert_system_shutdown()
        await multi_exchange_manager.shutdown()
    
    logger.info("Shutdown complete")


def create_app():
    """Create FastAPI application"""
    global app_config, app_secrets
    app_config, app_secrets = load_config()
    
    app = FastAPI(
        title="MarketMaker Pro API",
        version="4.2",
        description="Advanced Market Making Bot with Multi-Exchange Support",
        lifespan=lifespan
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "https://localhost:5173", "http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    return app


app = create_app()


# ============================================================================
# GENERAL ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "MarketMaker Pro API",
        "version": "4.2",
        "status": "operational",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "manager_initialized": multi_exchange_manager is not None
    }


@app.get("/config")
async def get_config():
    """Get current configuration (without secrets)"""
    if not multi_exchange_manager:
        raise HTTPException(status_code=503, detail="System not initialized")
    
    return {
        "exchanges": list(multi_exchange_manager.exchanges.keys()),
        "healthy_exchanges": multi_exchange_manager.get_healthy_exchanges(),
        "risk_mode": app_config.get("market_maker_v4_2", {}).get("risk_mode"),
        "symbols": app_config.get("market_maker_v4_2", {}).get("symbols", [])
    }


# ============================================================================
# MARKET DATA ENDPOINTS
# ============================================================================

@app.get("/api/v1/market-data")
async def get_market_data():
    """Get real-time market data from all exchanges"""
    if not multi_exchange_manager:
        raise HTTPException(status_code=503, detail="System not initialized")
    
    market_data = []
    symbols = multi_exchange_manager.get_all_symbols()
    
    # Limit to configured symbols if any
    cfg_symbols = app_config.get("market_maker_v4_2", {}).get("symbols", [])
    if cfg_symbols:
        symbols = cfg_symbols
    
    for symbol in symbols[:10]:  # Limit to 10 for performance
        try:
            exchange = multi_exchange_manager.get_exchange_for_symbol(symbol)
            if not exchange:
                continue
            
            ticker = await exchange.fetch_ticker(symbol)
            
            bid = ticker.get('bid', 0)
            ask = ticker.get('ask', 0)
            last = ticker.get('last', 0)
            
            spread = ((ask - bid) / last) if last > 0 else 0
            
            market_data.append({
                "symbol": symbol,
                "price": last,
                "change24h": ticker.get('percentage', 0),
                "volume": ticker.get('quoteVolume', 0),
                "spread": spread,
                "volatility": 0,  # TODO: Calculate from OHLCV
                "bid": bid,
                "ask": ask,
                "timestamp": datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error fetching market data for {symbol}: {e}")
            continue
    
    return market_data


@app.get("/api/v1/orderbook/{symbol}")
async def get_orderbook(symbol: str, limit: int = 20):
    """Get order book for a symbol"""
    if not multi_exchange_manager:
        raise HTTPException(status_code=503, detail="System not initialized")
    
    try:
        exchange = multi_exchange_manager.get_exchange_for_symbol(symbol)
        if not exchange:
            raise HTTPException(status_code=404, detail=f"No exchange supports {symbol}")
        
        orderbook = await exchange.fetch_order_book(symbol, limit)
        
        return {
            "symbol": symbol,
            "bids": orderbook.get('bids', [])[:limit],
            "asks": orderbook.get('asks', [])[:limit],
            "timestamp": orderbook.get('timestamp'),
            "datetime": orderbook.get('datetime')
        }
    except Exception as e:
        logger.error(f"Error fetching orderbook for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# POSITION ENDPOINTS
# ============================================================================

@app.get("/api/v1/positions")
async def get_positions(db: Session = Depends(get_db)):
    """Get all open positions"""
    if not multi_exchange_manager:
        raise HTTPException(status_code=503, detail="System not initialized")
    
    all_positions = []
    
    for exchange_name, exchange in multi_exchange_manager.get_all_exchanges().items():
        try:
            positions = await exchange.fetch_positions()
            
            for pos in positions:
                contracts = pos.get('contracts', 0)
                if contracts == 0:
                    continue
                
                all_positions.append({
                    "symbol": pos.get('symbol'),
                    "side": 'long' if pos.get('side') == 'long' else 'short',
                    "size": abs(contracts),
                    "entryPrice": pos.get('entryPrice', 0),
                    "markPrice": pos.get('markPrice', 0),
                    "liquidationPrice": pos.get('liquidationPrice'),
                    "leverage": pos.get('leverage', 1),
                    "pnl": pos.get('realizedPnl', 0),
                    "unrealizedPnl": pos.get('unrealizedPnl', 0),
                    "exchange": exchange_name,
                    "timestamp": datetime.now().isoformat()
                })
        except Exception as e:
            logger.error(f"Error fetching positions from {exchange_name}: {e}")
    
    return all_positions


@app.post("/api/v1/positions/{symbol}/close")
async def close_position(symbol: str, db: Session = Depends(get_db)):
    """Close a specific position"""
    if not multi_exchange_manager:
        raise HTTPException(status_code=503, detail="System not initialized")
    
    try:
        exchange = multi_exchange_manager.get_exchange_for_symbol(symbol)
        if not exchange:
            raise HTTPException(status_code=404, detail=f"No exchange supports {symbol}")
        
        # Get current position
        positions = await exchange.fetch_positions([symbol])
        if not positions or len(positions) == 0:
            raise HTTPException(status_code=404, detail=f"No open position for {symbol}")
        
        position = positions[0]
        size = abs(position.get('contracts', 0))
        side = position.get('side')
        
        if size == 0:
            raise HTTPException(status_code=404, detail=f"No open position for {symbol}")
        
        # Create closing order (opposite side)
        from exchanges.exchange_factory import OrderType, OrderSide
        close_side = OrderSide.SELL if side == 'long' else OrderSide.BUY
        
        order = await exchange.create_order(
            symbol=symbol,
            type=OrderType.MARKET,
            side=close_side,
            amount=size
        )
        
        logger.info(f"Position closed: {symbol} on {exchange.exchange_name}")
        
        # Send alert
        pnl = position.get('unrealizedPnl', 0)
        await multi_exchange_manager.alert_manager.alert_position_closed(
            symbol, pnl, "Manual close", exchange.exchange_name
        )
        
        return {
            "success": True,
            "symbol": symbol,
            "order_id": order.id,
            "message": f"Position closed for {symbol}"
        }
        
    except Exception as e:
        logger.error(f"Error closing position {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# ORDER ENDPOINTS
# ============================================================================

@app.get("/api/v1/orders")
async def get_orders():
    """Get all open orders"""
    if not multi_exchange_manager:
        raise HTTPException(status_code=503, detail="System not initialized")
    
    all_orders = []
    
    for exchange_name, exchange in multi_exchange_manager.get_all_exchanges().items():
        try:
            orders = await exchange.fetch_open_orders()
            
            for order in orders:
                all_orders.append({
                    "id": order.id,
                    "symbol": order.symbol,
                    "side": order.side.value,
                    "type": order.type.value,
                    "amount": order.amount,
                    "price": order.price,
                    "status": order.status,
                    "timestamp": order.timestamp,
                    "exchange": exchange_name
                })
        except Exception as e:
            logger.error(f"Error fetching orders from {exchange_name}: {e}")
    
    return all_orders


@app.post("/api/v1/orders/create")
async def create_order(request: OrderCreateRequest, db: Session = Depends(get_db)):
    """Create a new order"""
    if not multi_exchange_manager:
        raise HTTPException(status_code=503, detail="System not initialized")
    
    try:
        exchange = multi_exchange_manager.get_exchange_for_symbol(request.symbol)
        if not exchange:
            raise HTTPException(status_code=404, detail=f"No exchange supports {request.symbol}")
        
        from exchanges.exchange_factory import OrderType, OrderSide
        
        order_type = OrderType.LIMIT if request.type == "limit" else OrderType.MARKET
        order_side = OrderSide.BUY if request.side == "buy" else OrderSide.SELL
        
        order = await exchange.create_order(
            symbol=request.symbol,
            type=order_type,
            side=order_side,
            amount=request.amount,
            price=request.price
        )
        
        # Save to database
        trade = Trade(
            order_id=order.id,
            exchange=exchange.exchange_name,
            symbol=request.symbol,
            side=request.side,
            type=request.type,
            amount=request.amount,
            price=request.price or 0,
            status="open"
        )
        db.add(trade)
        db.commit()
        
        logger.info(f"Order created: {order.id}")
        
        return {
            "success": True,
            "order_id": order.id,
            "symbol": request.symbol,
            "side": request.side,
            "type": request.type,
            "amount": request.amount,
            "price": request.price
        }
        
    except InvalidOrderError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except InsufficientBalanceError as e:
        raise HTTPException(status_code=402, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating order: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/orders/{order_id}/cancel")
async def cancel_order(order_id: str, symbol: str):
    """Cancel an order"""
    if not multi_exchange_manager:
        raise HTTPException(status_code=503, detail="System not initialized")
    
    try:
        exchange = multi_exchange_manager.get_exchange_for_symbol(symbol)
        if not exchange:
            raise HTTPException(status_code=404, detail=f"No exchange supports {symbol}")
        
        await exchange.cancel_order(order_id, symbol)
        
        logger.info(f"Order canceled: {order_id}")
        
        return {
            "success": True,
            "order_id": order_id,
            "message": f"Order {order_id} canceled"
        }
        
    except Exception as e:
        logger.error(f"Error canceling order {order_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# METRICS ENDPOINTS
# ============================================================================

@app.get("/api/v1/metrics")
async def get_metrics(db: Session = Depends(get_db)):
    """Get system metrics"""
    if not multi_exchange_manager:
        raise HTTPException(status_code=503, detail="System not initialized")
    
    try:
        # Get positions and calculate PnL
        positions = await get_positions(db)
        orders = await get_orders()
        
        total_equity = 0
        total_pnl = 0
        unrealized_pnl = 0
        
        for pos in positions:
            unrealized_pnl += pos['unrealizedPnl']
            total_pnl += pos['pnl']
        
        # Get balance from exchanges
        for exchange_name, exchange in multi_exchange_manager.get_all_exchanges().items():
            try:
                balance = await exchange.fetch_balance()
                total_equity += balance.get('total', {}).get('USDT', 0)
            except:
                pass
        
        health = multi_exchange_manager.get_exchange_health()
        healthy_count = len([h for h in health.values() if h.connected])
        
        open_circuits = multi_exchange_manager.circuit_breaker_manager.get_open_count()
        
        metrics = {
            "equity": total_equity,
            "totalPnl": total_pnl,
            "dailyPnl": unrealized_pnl,
            "totalFees": 0,  # TODO: Track fees
            "openOrders": len(orders),
            "openPositions": len(positions),
            "healthyExchanges": healthy_count,
            "totalExchanges": len(multi_exchange_manager.exchanges),
            "openCircuits": open_circuits,
            "riskMode": app_config.get("market_maker_v4_2", {}).get("risk_mode", "conservative"),
            "timestamp": datetime.now().isoformat()
        }
        
        # Save to database
        metric_record = SystemMetric(**metrics)
        db.add(metric_record)
        db.commit()
        
        return metrics
        
    except Exception as e:
        logger.error(f"Error getting metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# SYSTEM STATUS ENDPOINTS
# ============================================================================

@app.get("/api/v1/system/status")
async def get_system_status():
    """Get complete system status"""
    if not multi_exchange_manager:
        return {"connected": False, "error": "System not initialized"}
    
    health = multi_exchange_manager.get_exchange_health()
    circuit_breakers = multi_exchange_manager.circuit_breaker_manager.get_status()
    alert_stats = multi_exchange_manager.alert_manager.get_stats()
    
    return {
        "connected": multi_exchange_manager.is_system_healthy(),
        "timestamp": datetime.now().isoformat(),
        "exchanges": {
            name: {
                "connected": h.connected,
                "latency_ms": h.latency_ms,
                "success_rate": h.success_rate,
                "error_count": h.error_count,
                "last_ping": h.last_ping
            }
            for name, h in health.items()
        },
        "circuit_breakers": circuit_breakers,
        "alerts": alert_stats
    }


@app.put("/api/v1/risk/mode")
async def update_risk_mode(request: RiskModeUpdate):
    """Update risk mode"""
    valid_modes = ["conservative", "aggressive", "aggressive_plus"]
    if request.mode not in valid_modes:
        raise HTTPException(status_code=400, detail=f"Invalid risk mode. Must be one of: {valid_modes}")
    
    # Update in config
    app_config["market_maker_v4_2"]["risk_mode"] = request.mode
    
    logger.info(f"Risk mode updated to: {request.mode}")
    
    return {
        "success": True,
        "mode": request.mode,
        "message": f"Risk mode updated to {request.mode}"
    }


# ============================================================================
# KUCOIN TEST ENDPOINTS (mantener compatibilidad)
# ============================================================================

@app.get("/api/test")
async def test_endpoint():
    """Test endpoint to verify API is working"""
    return {
        "status": "API is working",
        "timestamp": datetime.now().isoformat(),
        "kucoin_configured": bool(app_secrets.get("exchanges", {}).get("kucoin", {}).get("api_key")),
        "system_initialized": multi_exchange_manager is not None
    }


@app.get("/api/kucoin-credentials-check")
async def check_kucoin_credentials():
    """Check if KuCoin credentials are properly configured"""
    kucoin_config = app_secrets.get("exchanges", {}).get("kucoin", {})
    
    return {
        "api_key_configured": bool(kucoin_config.get("api_key")),
        "api_secret_configured": bool(kucoin_config.get("api_secret")),
        "passphrase_configured": bool(kucoin_config.get("passphrase")),
        "api_key_preview": kucoin_config.get("api_key", "")[:8] + "..." if kucoin_config.get("api_key") else "Not configured",
        "all_configured": all([
            kucoin_config.get("api_key"),
            kucoin_config.get("api_secret"),
            kucoin_config.get("passphrase")
        ])
    }


@app.post("/api/kucoin-test-proxy")
async def kucoin_test_proxy(request: KuCoinTestRequest):
    """Proxy endpoint for KuCoin API tests"""
    try:
        logger.info(f"KuCoin test request: {request.testType}")
        
        kucoin_config = app_secrets.get("exchanges", {}).get("kucoin", {})
        if not all([kucoin_config.get("api_key"), kucoin_config.get("api_secret"), kucoin_config.get("passphrase")]):
            return {
                "success": False,
                "error": "KuCoin credentials not configured",
                "testType": request.testType
            }
        
        # Get exchange from manager or create temporary one
        exchange = None
        if multi_exchange_manager and "kucoin" in multi_exchange_manager.exchanges:
            exchange = multi_exchange_manager.exchanges["kucoin"]
        else:
            full_config = {
                **kucoin_config,
                "api_timeout": 30,
                "rate_limit": 600,
                "default_type": "future",
                "hedge_mode": False,
                "testnet": False
            }
            exchange = ExchangeFactory.create_exchange("kucoin", full_config)
            await exchange.connect()
        
        # Handle test types
        if request.testType == "accountOverview":
            result = await exchange.fetch_balance()
            total_balance = sum(float(v) for v in result.get('total', {}).values() if v)
            result = {"total": total_balance, "currencies": result.get('total', {})}
        elif request.testType == "accounts":
            result = await exchange.fetch_balance()
        elif request.testType == "symbols":
            markets = await exchange.fetch_markets()
            usdt_markets = {m['symbol']: m for m in markets if m.get('quote') == 'USDT' and m.get('active')}
            result = usdt_markets
        elif request.testType == "btcTicker":
            symbol = request.params.get("symbol", "BTC/USDT")
            result = await exchange.fetch_ticker(symbol)
        else:
            return {
                "success": False,
                "error": f"Unknown test type: {request.testType}",
                "testType": request.testType
            }
        
        return {
            "success": True,
            "data": result,
            "testType": request.testType
        }
        
    except Exception as e:
        logger.error(f"KuCoin test error: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "testType": request.testType
        }


# ============================================================================
# HISTORY ENDPOINTS
# ============================================================================

# ============================================================================
# KUCOIN INFORMATION ENDPOINTS
# ============================================================================

@app.get("/api/v1/kucoin/symbols")
async def get_kucoin_symbols():
    """Get all available symbols from KuCoin"""
    try:
        if not multi_exchange_manager:
            raise HTTPException(status_code=503, detail="System not initialized")

        # Get KuCoin exchange from manager
        exchange = multi_exchange_manager.exchanges.get("kucoin")

        markets = await exchange.fetch_markets()
        usdt_symbols = [m for m in markets if m.get('quote') == 'USDT' and m.get('active')]

        return {
            "success": True,
            "exchange": "kucoin",
            "total_symbols": len(usdt_symbols),
            "symbols": usdt_symbols[:50],  # Limit to first 50 for performance
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting KuCoin symbols: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/kucoin/ticker/{symbol}")
async def get_kucoin_ticker(symbol: str):
    """Get ticker information for a specific symbol from KuCoin"""
    try:
        if not multi_exchange_manager:
            raise HTTPException(status_code=503, detail="System not initialized")

        # Get KuCoin exchange from manager
        exchange = multi_exchange_manager.exchanges.get("kucoin")
        if not exchange:
            logger.warning("KuCoin exchange not found in manager, creating temporary exchange")
            # Create temporary exchange for this request
            full_config = {
                "api_key": app_secrets["exchanges"]["kucoin"]["api_key"],
                "api_secret": app_secrets["exchanges"]["kucoin"]["api_secret"],
                "passphrase": app_secrets["exchanges"]["kucoin"]["passphrase"],
                "api_timeout": 30,
                "rate_limit": 600,
                "default_type": "future",
                "hedge_mode": False,
                "testnet": False
            }
            exchange = ExchangeFactory.create_exchange("kucoin", full_config)
            await exchange.connect()

        ticker = await exchange.fetch_ticker(symbol)

        return {
            "success": True,
            "exchange": "kucoin",
            "symbol": symbol,
            "ticker": ticker,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting KuCoin ticker for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/kucoin/balance")
async def get_kucoin_balance():
    """Get account balance from KuCoin"""
    try:
        if not multi_exchange_manager:
            raise HTTPException(status_code=503, detail="System not initialized")

        # Get KuCoin exchange from manager
        exchange = multi_exchange_manager.exchanges.get("kucoin")
        if not exchange:
            logger.warning("KuCoin exchange not found in manager, creating temporary exchange")
            # Create temporary exchange for this request
            full_config = {
                "api_key": app_secrets["exchanges"]["kucoin"]["api_key"],
                "api_secret": app_secrets["exchanges"]["kucoin"]["api_secret"],
                "passphrase": app_secrets["exchanges"]["kucoin"]["passphrase"],
                "api_timeout": 30,
                "rate_limit": 600,
                "default_type": "future",
                "hedge_mode": False,
                "testnet": False
            }
            exchange = ExchangeFactory.create_exchange("kucoin", full_config)
            await exchange.connect()

        balance = await exchange.fetch_balance()
        total_usd = sum(float(v) for v in balance.get('total', {}).values() if v)

        return {
            "success": True,
            "exchange": "kucoin",
            "balance": balance,
            "total_usd_value": total_usd,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting KuCoin balance: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/kucoin/orderbook/{symbol}")
async def get_kucoin_orderbook(symbol: str, limit: int = 20):
    """Get orderbook for a specific symbol from KuCoin"""
    try:
        if not multi_exchange_manager:
            raise HTTPException(status_code=503, detail="System not initialized")

        # Get KuCoin exchange from manager
        exchange = multi_exchange_manager.exchanges.get("kucoin")
        if not exchange:
            logger.warning("KuCoin exchange not found in manager, creating temporary exchange")
            # Create temporary exchange for this request
            full_config = {
                "api_key": app_secrets["exchanges"]["kucoin"]["api_key"],
                "api_secret": app_secrets["exchanges"]["kucoin"]["api_secret"],
                "passphrase": app_secrets["exchanges"]["kucoin"]["passphrase"],
                "api_timeout": 30,
                "rate_limit": 600,
                "default_type": "future",
                "hedge_mode": False,
                "testnet": False
            }
            exchange = ExchangeFactory.create_exchange("kucoin", full_config)
            await exchange.connect()

        orderbook = await exchange.fetch_order_book(symbol, limit)

        return {
            "success": True,
            "exchange": "kucoin",
            "symbol": symbol,
            "orderbook": orderbook,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting KuCoin orderbook for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/kucoin/status")
async def get_kucoin_status():
    """Get KuCoin exchange status and information"""
    try:
        if not multi_exchange_manager:
            raise HTTPException(status_code=503, detail="System not initialized")

        # Get KuCoin exchange from manager
        exchange = multi_exchange_manager.exchanges.get("kucoin")
        if not exchange:
            logger.warning("KuCoin exchange not found in manager, creating temporary exchange")
            # Create temporary exchange for this request
            full_config = {
                "api_key": app_secrets["exchanges"]["kucoin"]["api_key"],
                "api_secret": app_secrets["exchanges"]["kucoin"]["api_secret"],
                "passphrase": app_secrets["exchanges"]["kucoin"]["passphrase"],
                "api_timeout": 30,
                "rate_limit": 600,
                "default_type": "future",
                "hedge_mode": False,
                "testnet": False
            }
            exchange = ExchangeFactory.create_exchange("kucoin", full_config)
            await exchange.connect()

        # Get basic exchange info
        exchange_info = {
            "id": exchange.exchange.id,
            "name": exchange.exchange.name,
            "countries": exchange.exchange.countries,
            "rateLimit": exchange.exchange.rateLimit,
            "has": exchange.exchange.has,
            "timeframes": list(exchange.exchange.timeframes.keys()) if hasattr(exchange.exchange, 'timeframes') else [],
            "urls": exchange.exchange.urls
        }

        return {
            "success": True,
            "exchange": "kucoin",
            "status": "connected",
            "exchange_info": exchange_info,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting KuCoin status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/kucoin/markets")
async def get_kucoin_markets(limit: int = 100):
    """Get all available markets from KuCoin"""
    try:
        if not multi_exchange_manager:
            raise HTTPException(status_code=503, detail="System not initialized")

        # Get KuCoin exchange from manager
        exchange = multi_exchange_manager.exchanges.get("kucoin")
        if not exchange:
            logger.warning("KuCoin exchange not found in manager, creating temporary exchange")
            # Create temporary exchange for this request
            full_config = {
                "api_key": app_secrets["exchanges"]["kucoin"]["api_key"],
                "api_secret": app_secrets["exchanges"]["kucoin"]["api_secret"],
                "passphrase": app_secrets["exchanges"]["kucoin"]["passphrase"],
                "api_timeout": 30,
                "rate_limit": 600,
                "default_type": "future",
                "hedge_mode": False,
                "testnet": False
            }
            exchange = ExchangeFactory.create_exchange("kucoin", full_config)
            await exchange.connect()

        markets = await exchange.fetch_markets()

        # Filter and organize markets
        spot_markets = [m for m in markets if m.get('spot') and m.get('active')]
        futures_markets = [m for m in markets if m.get('future') and m.get('active')]

        return {
            "success": True,
            "exchange": "kucoin",
            "total_markets": len(markets),
            "spot_markets": len(spot_markets),
            "futures_markets": len(futures_markets),
            "markets": markets[:limit],  # Limit for performance
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting KuCoin markets: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/kucoin/ohlcv/{symbol}")
async def get_kucoin_ohlcv(symbol: str, timeframe: str = "1m", limit: int = 100):
    """Get OHLCV data for a specific symbol from KuCoin"""
    try:
        if not multi_exchange_manager:
            raise HTTPException(status_code=503, detail="System not initialized")

        # Get KuCoin exchange from manager
        exchange = multi_exchange_manager.exchanges.get("kucoin")

        ohlcv = await exchange.fetch_ohlcv(symbol, timeframe, limit=limit)

        return {
            "success": True,
            "exchange": "kucoin",
            "symbol": symbol,
            "timeframe": timeframe,
            "limit": limit,
            "ohlcv": ohlcv,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting KuCoin OHLCV for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/kucoin/trades/{symbol}")
async def get_kucoin_recent_trades(symbol: str, limit: int = 50):
    """Get recent trades for a specific symbol from KuCoin"""
    try:
        if not multi_exchange_manager:
            raise HTTPException(status_code=503, detail="System not initialized")

        # Get KuCoin exchange from manager
        exchange = multi_exchange_manager.exchanges.get("kucoin")

        trades = await exchange.fetch_trades(symbol, limit=limit)

        return {
            "success": True,
            "exchange": "kucoin",
            "symbol": symbol,
            "limit": limit,
            "trades": trades,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting KuCoin trades for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/kucoin/funding-rates/{symbol}")
async def get_kucoin_funding_rates(symbol: str):
    """Get funding rate history for a specific symbol from KuCoin"""
    try:
        if not multi_exchange_manager:
            raise HTTPException(status_code=503, detail="System not initialized")

        # Get KuCoin exchange from manager
        exchange = multi_exchange_manager.exchanges.get("kucoin")

        # Get funding rate history
        funding_rates = await exchange.fetch_funding_rate_history(symbol, limit=100)

        return {
            "success": True,
            "exchange": "kucoin",
            "symbol": symbol,
            "funding_rates": funding_rates,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting KuCoin funding rates for {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# HISTORY ENDPOINTS
# ============================================================================

@app.get("/api/v1/history/trades")
async def get_trade_history(
    limit: int = 100,
    exchange: Optional[str] = None,
    symbol: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get trade history"""
    query = db.query(Trade).order_by(Trade.timestamp.desc())
    
    if exchange:
        query = query.filter(Trade.exchange == exchange)
    if symbol:
        query = query.filter(Trade.symbol == symbol)
    
    trades = query.limit(limit).all()
    
    return [
        {
            "id": t.id,
            "order_id": t.order_id,
            "exchange": t.exchange,
            "symbol": t.symbol,
            "side": t.side,
            "type": t.type,
            "amount": t.amount,
            "price": t.price,
            "filled": t.filled,
            "fee": t.fee,
            "pnl": t.pnl,
            "status": t.status,
            "timestamp": t.timestamp.isoformat() if t.timestamp else None
        }
        for t in trades
    ]


@app.get("/api/v1/history/circuit-breakers")
async def get_circuit_breaker_history(
    limit: int = 50,
    breaker_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get circuit breaker event history"""
    query = db.query(CircuitBreakerEvent).order_by(CircuitBreakerEvent.timestamp.desc())
    
    if breaker_type:
        query = query.filter(CircuitBreakerEvent.breaker_type == breaker_type)
    
    events = query.limit(limit).all()
    
    return [
        {
            "id": e.id,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
            "exchange": e.exchange,
            "breaker_type": e.breaker_type,
            "trigger_value": e.trigger_value,
            "threshold": e.threshold,
            "duration_seconds": e.duration_seconds,
            "is_resolved": e.is_resolved,
            "resolved_at": e.resolved_at.isoformat() if e.resolved_at else None
        }
        for e in events
    ]


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting MarketMaker Pro API Server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

