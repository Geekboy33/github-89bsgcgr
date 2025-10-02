import asyncio
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from exchanges.exchange_factory import ExchangeFactory, ExchangeWrapper
from core.logger import get_logger
from core.circuit_breaker import CircuitBreakerManager
from core.alerts import AlertManager

logger = get_logger("multi_exchange_manager", "multi_exchange.log")

@dataclass
class ExchangeHealth:
    name: str
    connected: bool
    last_ping: float
    latency_ms: float
    error_count: int
    success_rate: float
    api_calls_used: int
    api_calls_limit: int
    features: Dict[str, bool]

class MultiExchangeManager:
    def __init__(self, config: Dict[str, Any], secrets: Dict[str, Any]):
        self.config = config
        self.secrets = secrets
        
        self.exchanges: Dict[str, ExchangeWrapper] = {}
        self.health: Dict[str, ExchangeHealth] = {}
        self.strategy = config.get("exchange_strategy", {})
        self.symbol_distribution = config.get("symbol_distribution", {})
        
        self.health_check_interval = self.strategy.get("health_check_interval", 30)
        self.min_healthy_exchanges = self.strategy.get("min_healthy_exchanges", 1)
        
        # Inicializar Circuit Breakers y Alertas
        self.circuit_breaker_manager = CircuitBreakerManager(config)
        
        # Merge secrets into config for alerts
        alert_config = dict(config)
        if "alerts" not in alert_config:
            alert_config["alerts"] = {}
        alert_config["alerts"]["telegram"] = secrets.get("alerts", {}).get("telegram", {})
        self.alert_manager = AlertManager(alert_config)
        
        logger.info("MultiExchangeManager initialized with circuit breakers and alerts")
        
    async def initialize(self):
        """Initialize all configured exchanges"""
        exchanges_config = self.config.get("exchanges", {})
        
        for exchange_name, exchange_config in exchanges_config.items():
            if not exchange_config.get("enabled", False):
                continue
                
            try:
                # Get credentials from secrets
                credentials = self.secrets.get("exchanges", {}).get(exchange_name, {})
                if not credentials.get("api_key") or not credentials.get("api_secret"):
                    self.log.warning(f"Missing credentials for {exchange_name}")
                    continue
                
                # Merge config with credentials
                full_config = {**exchange_config, **credentials}
                
                # Validate configuration
                if not ExchangeFactory.validate_exchange_config(exchange_name, full_config):
                    self.log.error(f"Invalid configuration for {exchange_name}")
                    continue
                
                # Create exchange wrapper
                exchange = ExchangeFactory.create_exchange(exchange_name, full_config)
                
                # Test connection
                if await exchange.connect():
                    self.exchanges[exchange_name] = exchange
                    self.health[exchange_name] = ExchangeHealth(
                        name=exchange_name,
                        connected=True,
                        last_ping=time.time(),
                        latency_ms=0.0,
                        error_count=0,
                        success_rate=1.0,
                        api_calls_used=0,
                        api_calls_limit=exchange_config.get("rate_limit", 600),
                        features=exchange_config.get("features", {})
                    )
                    self.log.info(f"Successfully connected to {exchange_name}")
                else:
                    self.log.error(f"Failed to connect to {exchange_name}")
                    
            except Exception as e:
                self.log.error(f"Error initializing {exchange_name}: {e}")
    
    async def start_health_monitoring(self):
        """Start continuous health monitoring"""
        while True:
            try:
                await self._health_check_all()
                await asyncio.sleep(self.health_check_interval)
            except Exception as e:
                self.log.error(f"Health monitoring error: {e}")
                await asyncio.sleep(5)
    
    async def _health_check_all(self):
        """Check health of all exchanges"""
        tasks = []
        for exchange_name in self.exchanges.keys():
            tasks.append(self._health_check_single(exchange_name))
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _health_check_single(self, exchange_name: str):
        """Check health of a single exchange with circuit breakers"""
        try:
            exchange = self.exchanges[exchange_name]
            health = self.health[exchange_name]
            
            start_time = time.time()
            
            # Simple health check - fetch balance
            await exchange.fetch_balance()
            
            end_time = time.time()
            latency_ms = (end_time - start_time) * 1000
            
            # CHECK CIRCUIT BREAKER - LATENCY
            self.circuit_breaker_manager.check("latency", latency_ms, exchange_name)
            
            # Si breaker de latencia está abierto, marcar exchange como unhealthy
            if self.circuit_breaker_manager.is_open("latency", exchange_name):
                health.connected = False
                logger.warning(f"⚠️ {exchange_name} marked as unhealthy due to latency circuit breaker")
                await self.alert_manager.alert_circuit_breaker_open(
                    "Latency", exchange_name, latency_ms, 
                    self.circuit_breaker_manager.breakers["latency"].threshold
                )
                return
            
            # Update health metrics
            health.connected = True
            health.last_ping = end_time
            health.latency_ms = latency_ms
            health.error_count = max(0, health.error_count - 1)  # Decay error count
            
            # Update success rate (simple moving average)
            old_rate = health.success_rate
            health.success_rate = min(1.0, health.success_rate + 0.1)
            
            # Si se recuperó, enviar alerta
            if old_rate < 0.5 and health.success_rate >= 0.5:
                await self.alert_manager.alert_exchange_reconnected(exchange_name)
            
            # CHECK ERROR RATE CIRCUIT BREAKER
            error_rate = health.error_count / max(1, health.error_count + 10)
            self.circuit_breaker_manager.check("error_rate", error_rate, exchange_name)
            
        except Exception as e:
            logger.warning(f"Health check failed for {exchange_name}: {e}")
            health = self.health[exchange_name]
            
            old_connected = health.connected
            health.connected = False
            health.error_count += 1
            health.success_rate = max(0.0, health.success_rate - 0.2)
            
            # Alerta de desconexión
            if old_connected:
                await self.alert_manager.alert_exchange_disconnected(exchange_name, str(e))
            
            # CHECK ERROR RATE CIRCUIT BREAKER
            error_rate = health.error_count / max(1, health.error_count + 10)
            self.circuit_breaker_manager.check("error_rate", error_rate, exchange_name)
    
    def get_healthy_exchanges(self) -> List[str]:
        """Get list of healthy exchanges"""
        healthy = []
        for name, health in self.health.items():
            if health.connected and health.success_rate > 0.5:
                healthy.append(name)
        return healthy
    
    def get_exchange_for_symbol(self, symbol: str) -> Optional[ExchangeWrapper]:
        """Get best exchange for a specific symbol"""
        strategy_mode = self.strategy.get("mode", "failover")
        
        if strategy_mode == "single":
            primary = self.strategy.get("primary_exchange")
            if primary and primary in self.exchanges and self.health[primary].connected:
                return self.exchanges[primary]
        
        elif strategy_mode == "failover":
            failover_order = self.strategy.get("failover_order", [])
            for exchange_name in failover_order:
                if (exchange_name in self.exchanges and 
                    self.health[exchange_name].connected and
                    self._symbol_supported(exchange_name, symbol)):
                    return self.exchanges[exchange_name]
        
        elif strategy_mode == "load_balance":
            return self._get_load_balanced_exchange(symbol)
        
        elif strategy_mode == "best_execution":
            return self._get_best_execution_exchange(symbol)
        
        return None
    
    def _symbol_supported(self, exchange_name: str, symbol: str) -> bool:
        """Check if symbol is supported on exchange"""
        exchange_config = self.config.get("exchanges", {}).get(exchange_name, {})
        supported_symbols = exchange_config.get("symbols", [])
        
        # If no specific symbols configured, assume all are supported
        if not supported_symbols:
            return True
            
        return symbol in supported_symbols
    
    def _get_load_balanced_exchange(self, symbol: str) -> Optional[ExchangeWrapper]:
        """Get exchange based on load balancing weights"""
        weights = self.strategy.get("load_balance_weights", {})
        healthy_exchanges = self.get_healthy_exchanges()
        
        # Filter by symbol support and health
        candidates = []
        for exchange_name in healthy_exchanges:
            if (self._symbol_supported(exchange_name, symbol) and 
                exchange_name in weights):
                candidates.append((exchange_name, weights[exchange_name]))
        
        if not candidates:
            return None
        
        # Simple weighted selection (could be improved with actual load metrics)
        candidates.sort(key=lambda x: x[1], reverse=True)
        return self.exchanges[candidates[0][0]]
    
    def _get_best_execution_exchange(self, symbol: str) -> Optional[ExchangeWrapper]:
        """Get exchange with best execution for symbol"""
        healthy_exchanges = self.get_healthy_exchanges()
        
        # Filter by symbol support
        candidates = []
        for exchange_name in healthy_exchanges:
            if self._symbol_supported(exchange_name, symbol):
                health = self.health[exchange_name]
                # Score based on latency and success rate
                score = health.success_rate * 100 - health.latency_ms / 10
                candidates.append((exchange_name, score))
        
        if not candidates:
            return None
        
        # Return exchange with highest score
        candidates.sort(key=lambda x: x[1], reverse=True)
        return self.exchanges[candidates[0][0]]
    
    def get_all_exchanges(self) -> Dict[str, ExchangeWrapper]:
        """Get all initialized exchanges"""
        return self.exchanges.copy()
    
    def get_exchange_health(self) -> Dict[str, ExchangeHealth]:
        """Get health status of all exchanges"""
        return self.health.copy()
    
    def get_symbols_for_exchange(self, exchange_name: str) -> List[str]:
        """Get configured symbols for specific exchange"""
        exchange_config = self.config.get("exchanges", {}).get(exchange_name, {})
        return exchange_config.get("symbols", [])
    
    def get_all_symbols(self) -> List[str]:
        """Get all unique symbols across all exchanges"""
        all_symbols = set()
        for exchange_config in self.config.get("exchanges", {}).values():
            if exchange_config.get("enabled", False):
                symbols = exchange_config.get("symbols", [])
                all_symbols.update(symbols)
        return list(all_symbols)
    
    async def shutdown(self):
        """Shutdown all exchanges"""
        for exchange_name, exchange in self.exchanges.items():
            try:
                if hasattr(exchange.exchange, 'close'):
                    await exchange.exchange.close()
                self.log.info(f"Closed connection to {exchange_name}")
            except Exception as e:
                self.log.error(f"Error closing {exchange_name}: {e}")
    
    def is_system_healthy(self) -> bool:
        """Check if system has minimum required healthy exchanges"""
        healthy_count = len(self.get_healthy_exchanges())
        return healthy_count >= self.min_healthy_exchanges