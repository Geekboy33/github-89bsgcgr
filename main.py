from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import logging
import os
import json
from pathlib import Path
from typing import Dict, Any, Optional

# Simple logger function
def get_logger(name: str):
    logging.basicConfig(level=logging.INFO)
    return logging.getLogger(name)

# Simple config validation
def validate_config(config):
    return config

from exchanges.exchange_factory import ExchangeFactory

# Request model for KuCoin test proxy
class KuCoinTestRequest(BaseModel):
    testType: str
    params: dict = {}

def load_config():
    """Load configuration from config.json with .env overrides"""
    config_path = Path("config.json")
    if not config_path.exists():
        raise FileNotFoundError("config.json not found")
    
    with open(config_path, 'r') as f:
        cfg = json.load(f)
    
    # Validate config
    cfg = validate_config(cfg)  # Simple pass-through for now
    
    # Load secrets from secrets.json
    secrets_path = Path("secrets.json")
    secrets = {}
    if secrets_path.exists():
        with open(secrets_path, 'r') as f:
            secrets = json.load(f)
    
    # Override with .env values
    from dotenv import load_dotenv
    load_dotenv()
    
    # Binance overrides from .env
    binance_key = os.getenv("BINANCE_API_KEY")
    binance_secret = os.getenv("BINANCE_API_SECRET")
    if binance_key and binance_secret:
        secrets.setdefault("exchanges", {}).setdefault("binance", {})
        secrets["exchanges"]["binance"]["api_key"] = binance_key
        secrets["exchanges"]["binance"]["api_secret"] = binance_secret
    
    # Bybit overrides from .env
    bybit_key = os.getenv("BYBIT_API_KEY")
    bybit_secret = os.getenv("BYBIT_API_SECRET")
    if bybit_key and bybit_secret:
        secrets.setdefault("exchanges", {}).setdefault("bybit", {})
        secrets["exchanges"]["bybit"]["api_key"] = bybit_key
        secrets["exchanges"]["bybit"]["api_secret"] = bybit_secret
    
    # Telegram overrides from .env
    tg_token = os.getenv("TELEGRAM_BOT_TOKEN")
    tg_chat  = os.getenv("TELEGRAM_CHAT_ID")
    if tg_token and tg_chat:
        secrets.setdefault("alerts", {}).setdefault("telegram", {})
        secrets["alerts"]["telegram"]["bot_token"] = tg_token
        secrets["alerts"]["telegram"]["chat_id"] = tg_chat

    # KuCoin overrides from .env
    kucoin_key = os.getenv("KUCOIN_API_KEY")
    kucoin_secret = os.getenv("KUCOIN_API_SECRET")
    kucoin_passphrase = os.getenv("KUCOIN_PASSPHRASE")
    if kucoin_key and kucoin_secret and kucoin_passphrase:
        secrets.setdefault("exchanges", {}).setdefault("kucoin", {})
        secrets["exchanges"]["kucoin"]["api_key"] = kucoin_key
        secrets["exchanges"]["kucoin"]["api_secret"] = kucoin_secret
        secrets["exchanges"]["kucoin"]["passphrase"] = kucoin_passphrase

    logger = get_logger("main")
    logger.info("Starting MarketMaker Pro + patches (hedge, WAL/async DB, PnL, schema, throttle)")

    exchanges_config = []  # Simplified for now
    
    return cfg, secrets, exchanges_config

def create_app():
    """Create FastAPI application"""
    cfg, secrets, exchanges_config = load_config()
    logger = get_logger("api")
    
    app = FastAPI(title="MarketMaker Pro API")
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "https://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/")
    async def root():
        return {"message": "MarketMaker Pro API", "version": "4.2"}

    @app.get("/config")
    async def get_config():
        """Get current configuration (without secrets)"""
        return {
            "exchanges": [{"exchange": ex["exchange"]} for ex in exchanges_config],
            "config": cfg
        }

    @app.get("/health")
    async def health():
        return {"status": "healthy", "timestamp": asyncio.get_event_loop().time()}
    
    @app.get("/api/test")
    async def test_endpoint():
        """Test endpoint to verify API is working"""
        return {
            "status": "API is working",
            "timestamp": asyncio.get_event_loop().time(),
            "kucoin_configured": bool(secrets.get("exchanges", {}).get("kucoin", {}).get("api_key"))
        }
    
    @app.get("/api/kucoin-credentials-check")
    async def check_kucoin_credentials():
        """Check if KuCoin credentials are properly configured"""
        kucoin_config = secrets.get("exchanges", {}).get("kucoin", {})
        
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
        """Proxy endpoint for KuCoin API tests to avoid CORS issues"""
        try:
            logger.info(f"KuCoin test request: {request.testType}")
            
            # Get KuCoin credentials from secrets
            kucoin_config = secrets.get("exchanges", {}).get("kucoin", {})
            if not all([kucoin_config.get("api_key"), kucoin_config.get("api_secret"), kucoin_config.get("passphrase")]):
                return {
                    "success": False,
                    "error": "KuCoin credentials not configured",
                    "details": {
                        "api_key": bool(kucoin_config.get("api_key")),
                        "api_secret": bool(kucoin_config.get("api_secret")),
                        "passphrase": bool(kucoin_config.get("passphrase"))
                    }
                }
            
            # Create exchange wrapper
            full_config = {
                "api_key": kucoin_config["api_key"],
                "api_secret": kucoin_config["api_secret"],
                "passphrase": kucoin_config["passphrase"],
                "api_timeout": 30,
                "rate_limit": 600,
                "default_type": "future",
                "hedge_mode": False,
                "testnet": False
            }
            
            exchange = ExchangeFactory.create_exchange("kucoin", full_config)
            
            # Test connection first
            connected = await exchange.connect()
            if not connected:
                return {
                    "success": False,
                    "error": "Failed to connect to KuCoin",
                    "testType": request.testType
                }
            
            # Handle different test types
            if request.testType == "accountOverview":
                result = await exchange.fetch_balance()
                # Extract relevant data for account overview
                if result:
                    total_balance = sum(float(v) for v in result.get('total', {}).values() if v)
                    result = {"total": total_balance, "currencies": result.get('total', {})}
            elif request.testType == "accounts":
                result = await exchange.fetch_balance()
            elif request.testType == "symbols":
                markets = await exchange.fetch_markets()
                # Filter for active USDT pairs
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
            
            # Close connection
            if hasattr(exchange.exchange, 'close'):
                await exchange.exchange.close()
            
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

# Create the app instance
app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)