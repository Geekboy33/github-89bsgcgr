from enum import Enum
from typing import Any, Dict, List, Optional
import ccxt.async_support as ccxt
import asyncio
from core.exceptions import (
    ExchangeConnectionError, 
    InsufficientBalanceError, 
    InvalidOrderError,
    MarketMakerException
)
from core.logger import get_logger

logger = get_logger("exchange_factory", "exchanges.log")

class OrderType(Enum):
    LIMIT = "limit"
    MARKET = "market"

class OrderSide(Enum):
    BUY = "buy"
    SELL = "sell"

class Order:
    def __init__(self, id: str, symbol: str, type: OrderType, side: OrderSide, 
                 amount: float, price: float, status: str, timestamp: int):
        self.id = id
        self.symbol = symbol
        self.type = type
        self.side = side
        self.amount = amount
        self.price = price
        self.status = status
        self.timestamp = timestamp

class ExchangeWrapper:
    def __init__(self, exchange_name: str, config: Dict[str, Any]):
        self.config = config
        self.exchange_name = exchange_name
        self.exchange = self._create_exchange(exchange_name, config)

    def _create_exchange(self, exchange_name: str, config: Dict[str, Any]):
        """Create exchange instance based on name and config"""
        base_config = {
            'apiKey': config['api_key'],
            'secret': config['api_secret'],
            'timeout': config.get('api_timeout', 30) * 1000,
            'enableRateLimit': True,
        }
        
        # Add passphrase for exchanges that require it
        if config.get('passphrase'):
            base_config['password'] = config['passphrase']
            
        # Testnet configuration
        if config.get('testnet', False):
            base_config['sandbox'] = True
            if config.get('testnet_api_key'):
                base_config['apiKey'] = config['testnet_api_key']
                base_config['secret'] = config['testnet_api_secret']
                if config.get('testnet_passphrase'):
                    base_config['password'] = config['testnet_passphrase']

        if exchange_name == "binance":
            base_config['options'] = {
                'defaultType': config.get('default_type', 'future'),
                'hedgeMode': config.get('hedge_mode', True)
            }
            return ccxt.binance(base_config)
            
        elif exchange_name == "kucoin":
            base_config['options'] = {
                'defaultType': config.get('default_type', 'future'),
            }
            return ccxt.kucoinfutures(base_config) if config.get('default_type') == 'future' else ccxt.kucoin(base_config)
            
        elif exchange_name == "okx":
            base_config['options'] = {
                'defaultType': config.get('default_type', 'swap'),
            }
            return ccxt.okx(base_config)
            
        elif exchange_name == "bybit":
            base_config['options'] = {
                'defaultType': config.get('default_type', 'linear'),
            }
            return ccxt.bybit(base_config)
            
        elif exchange_name == "gate":
            base_config['options'] = {
                'defaultType': config.get('default_type', 'future'),
            }
            return ccxt.gateio(base_config)
            
        elif exchange_name == "huobi":
            base_config['options'] = {
                'defaultType': config.get('default_type', 'future'),
            }
            return ccxt.huobi(base_config)
            
        elif exchange_name == "ftx":
            return ccxt.ftx(base_config)
            
        elif exchange_name == "kraken":
            return ccxt.kraken(base_config)
            
        elif exchange_name == "coinbase":
            return ccxt.coinbasepro(base_config)
            
        elif exchange_name == "bitfinex":
            return ccxt.bitfinex(base_config)
            
        else:
            raise ValueError(f"Unsupported exchange: {exchange_name}")

        # Set rate limit based on config
        self.exchange.rateLimit = max(1, 1000 / config.get('rate_limit', 250))

    async def connect(self) -> bool:
        """Conectar con retry logic"""
        max_retries = 3
        retry_delay = 5
        
        for attempt in range(max_retries):
            try:
                logger.info(f"Connecting to {self.exchange_name} (attempt {attempt+1}/{max_retries})...")
                
                await self.exchange.load_markets()
                
                # Exchange-specific setup
                if self.exchange_name == "binance" and self.config.get('hedge_mode', True):
                    try:
                        await self.exchange.set_position_mode(True)  # True = HEDGE
                        logger.info(f"Hedge mode enabled on {self.exchange_name}")
                    except Exception as e:
                        logger.warning(f"Could not set hedge mode on {self.exchange_name}: {e}")
                        
                elif self.exchange_name == "okx" and self.config.get('hedge_mode', True):
                    try:
                        await self.exchange.set_position_mode(True)
                        logger.info(f"Hedge mode enabled on {self.exchange_name}")
                    except Exception as e:
                        logger.warning(f"Could not set hedge mode on {self.exchange_name}: {e}")
                        
                elif self.exchange_name == "bybit" and self.config.get('hedge_mode', True):
                    try:
                        await self.exchange.set_position_mode(True)
                        logger.info(f"Hedge mode enabled on {self.exchange_name}")
                    except Exception as e:
                        logger.warning(f"Could not set hedge mode on {self.exchange_name}: {e}")
                
                logger.info(f"Successfully connected to {self.exchange_name}")
                return True
                
            except ccxt.AuthenticationError as e:
                logger.error(f"Authentication failed for {self.exchange_name}: {e}")
                raise ExchangeConnectionError(f"Invalid credentials for {self.exchange_name}")
                
            except ccxt.NetworkError as e:
                logger.warning(
                    f"Network error on {self.exchange_name} (attempt {attempt+1}/{max_retries}): {e}",
                    extra={'exchange': self.exchange_name, 'attempt': attempt+1}
                )
                if attempt < max_retries - 1:
                    await asyncio.sleep(retry_delay)
                    continue
                raise ExchangeConnectionError(f"Network error on {self.exchange_name}")
                
            except Exception as e:
                logger.error(f"Unexpected error connecting to {self.exchange_name}: {e}")
                raise ExchangeConnectionError(f"Failed to connect: {e}")
        
        return False

    async def fetch_balance(self):
        return await self.exchange.fetch_balance()

    async def fetch_positions(self, symbols: List[str] = None):
        if hasattr(self.exchange, 'fetch_positions'):
            return await self.exchange.fetch_positions(symbols)
        return []

    async def fetch_order_book(self, symbol: str, limit: int = None):
        return await self.exchange.fetch_order_book(symbol, limit)

    async def fetch_ticker(self, symbol: str):
        return await self.exchange.fetch_ticker(symbol)

    async def fetch_ohlcv(self, symbol: str, timeframe: str, since: int = None, limit: int = None):
        return await self.exchange.fetch_ohlcv(symbol, timeframe, since, limit)

    async def fetch_open_orders(self, symbol: str = None):
        orders = await self.exchange.fetch_open_orders(symbol)
        mapped = []
        for o in orders:
            amt = o.get('amount')
            if amt is None:
                remaining = o.get('remaining') or 0.0
                filled = o.get('filled') or 0.0
                amt = remaining + filled
            try:
                otype = OrderType(o.get('type'))
            except Exception:
                otype = OrderType.LIMIT if o.get('type') == 'limit' else OrderType.MARKET
            try:
                oside = OrderSide(o.get('side'))
            except Exception:
                oside = OrderSide.BUY if o.get('side') == 'buy' else OrderSide.SELL

            mapped.append(Order(
                id=o.get('id'),
                symbol=o.get('symbol'),
                type=otype,
                side=oside,
                amount=float(amt or 0.0),
                price=float(o.get('price') or 0.0),
                status=o.get('status'),
                timestamp=o.get('timestamp') or 0
            ))
        return mapped

    async def fetch_my_trades(self, symbol: Optional[str] = None, since: Optional[int] = None, limit: Optional[int] = 50):
        if hasattr(self.exchange, 'fetch_my_trades'):
            return await self.exchange.fetch_my_trades(symbol, since=since, limit=limit)
        return []

    async def create_order(self, symbol: str, type: OrderType, side: OrderSide, amount: float, price: float = None):
        """Crear orden con validación y manejo de errores robusto"""
        try:
            # Validar parámetros
            if amount <= 0:
                raise InvalidOrderError("Amount must be positive")
            
            if type == OrderType.LIMIT and (price is None or price <= 0):
                raise InvalidOrderError("Price required and must be positive for limit orders")
            
            # Verificar balance antes de crear orden
            try:
                balance = await self.fetch_balance()
                usdt_balance = balance.get('free', {}).get('USDT', 0)
                
                required_balance = amount * (price if price else 0)
                if price and required_balance > usdt_balance:
                    logger.warning(
                        f"Potentially insufficient balance: need {required_balance:.2f}, have {usdt_balance:.2f}",
                        extra={'exchange': self.exchange_name, 'symbol': symbol}
                    )
            except Exception as e:
                logger.warning(f"Could not verify balance: {e}")
            
            params = {}

            # Exchange-specific hedge mode handling
            if self.config.get('hedge_mode', True):
                if self.exchange_name == "binance":
                    params['positionSide'] = 'LONG' if side == OrderSide.BUY else 'SHORT'
                elif self.exchange_name == "okx":
                    params['posSide'] = 'long' if side == OrderSide.BUY else 'short'
                elif self.exchange_name == "bybit":
                    params['reduce_only'] = False
                elif self.exchange_name == "kucoin":
                    params['reduceOnly'] = False

            order = await self.exchange.create_order(symbol, type.value, side.value, amount, price, params)
            
            logger.info(
                f"Order created: {order.get('id')} - {symbol} {side.value} {amount}",
                extra={
                    'exchange': self.exchange_name,
                    'symbol': symbol,
                    'order_id': order.get('id'),
                    'side': side.value,
                    'amount': amount,
                    'price': price
                }
            )

            try:
                otype = OrderType(order.get('type'))
            except Exception:
                otype = OrderType.LIMIT if order.get('type') == 'limit' else OrderType.MARKET
            try:
                oside = OrderSide(order.get('side'))
            except Exception:
                oside = OrderSide.BUY if order.get('side') == 'buy' else OrderSide.SELL

            return Order(
                id=order.get('id'),
                symbol=order.get('symbol'),
                type=otype,
                side=oside,
                amount=float(order.get('amount') or order.get('filled') or 0.0),
                price=float(order.get('price') or 0.0),
                status=order.get('status'),
                timestamp=order.get('timestamp') or 0
            )
            
        except InvalidOrderError:
            raise
        except ccxt.InsufficientFunds as e:
            logger.error(f"Insufficient funds: {e}", extra={'exchange': self.exchange_name})
            raise InsufficientBalanceError(f"Exchange reports insufficient funds: {e}")
        except ccxt.InvalidOrder as e:
            logger.error(f"Invalid order: {e}", extra={'exchange': self.exchange_name})
            raise InvalidOrderError(f"Invalid order parameters: {e}")
        except ccxt.NetworkError as e:
            logger.error(f"Network error creating order: {e}", extra={'exchange': self.exchange_name})
            raise ExchangeConnectionError(f"Network error: {e}")
        except Exception as e:
            logger.error(f"Unexpected error creating order: {e}", extra={'exchange': self.exchange_name})
            raise MarketMakerException(f"Order creation failed: {e}")

    async def cancel_order(self, order_id: str, symbol: str):
        return await self.exchange.cancel_order(order_id, symbol)

    async def set_leverage(self, symbol: str, leverage: float):
        if hasattr(self.exchange, 'set_leverage'):
            await self.exchange.set_leverage(leverage, symbol)
            return True
        return False

    async def set_margin_mode(self, symbol: str, margin_mode: str):
        if hasattr(self.exchange, 'set_margin_mode'):
            await self.exchange.set_margin_mode(margin_mode, symbol)
            return True
        return False

    async def fetch_funding_rate(self, symbol: str):
        if hasattr(self.exchange, 'fetch_funding_rate'):
            return await self.exchange.fetch_funding_rate(symbol)
        return None

    async def fetch_tickers(self):
        if hasattr(self.exchange, 'fetch_tickers'):
            return await self.exchange.fetch_tickers()
        return {}

    async def fetch_markets(self):
        return await self.exchange.fetch_markets()

    def get_exchange_info(self):
        """Get exchange capabilities and info"""
        return {
            'name': self.exchange_name,
            'has': self.exchange.has,
            'timeframes': getattr(self.exchange, 'timeframes', {}),
            'fees': getattr(self.exchange, 'fees', {}),
            'limits': getattr(self.exchange, 'limits', {}),
            'precision': getattr(self.exchange, 'precision', {}),
            'countries': getattr(self.exchange, 'countries', []),
            'version': getattr(self.exchange, 'version', 'unknown'),
        }

class ExchangeFactory:
    SUPPORTED_EXCHANGES = [
        'binance', 'kucoin', 'okx', 'bybit', 'gate', 
        'huobi', 'ftx', 'kraken', 'coinbase', 'bitfinex'
    ]

    @staticmethod
    def create_exchange(exchange_name: str, config: Dict[str, Any]) -> ExchangeWrapper:
        if exchange_name not in ExchangeFactory.SUPPORTED_EXCHANGES:
            raise ValueError(f"Unsupported exchange: {exchange_name}. Supported: {ExchangeFactory.SUPPORTED_EXCHANGES}")
        return ExchangeWrapper(exchange_name, config)

    @staticmethod
    def get_supported_exchanges() -> List[str]:
        return ExchangeFactory.SUPPORTED_EXCHANGES.copy()

    @staticmethod
    def validate_exchange_config(exchange_name: str, config: Dict[str, Any]) -> bool:
        """Validate exchange configuration"""
        required_fields = ['api_key', 'api_secret']
        
        # Add passphrase requirement for specific exchanges
        if exchange_name in ['kucoin', 'okx']:
            required_fields.append('passphrase')
            
        for field in required_fields:
            if not config.get(field):
                return False
                
        return True