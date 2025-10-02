"""
Sistema de Circuit Breakers para protección de riesgo
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, Optional, Callable, List
from enum import Enum
from core.logger import get_logger

logger = get_logger("circuit_breaker", "circuit_breaker.log")

class BreakerType(Enum):
    """Tipos de circuit breakers"""
    LATENCY = "latency"
    SPREAD = "spread"
    VOLATILITY = "volatility"
    ERROR_RATE = "error_rate"
    DRAWDOWN = "drawdown"

@dataclass
class CircuitBreaker:
    """Circuit Breaker individual"""
    name: str
    breaker_type: BreakerType
    threshold: float
    cooldown_seconds: int
    is_open: bool = False
    opened_at: Optional[datetime] = None
    trigger_count: int = 0
    consecutive_violations: int = 0
    max_consecutive: int = 3
    on_open_callback: Optional[Callable] = None
    on_close_callback: Optional[Callable] = None
    metadata: Dict = field(default_factory=dict)
    
    def should_open(self, current_value: float) -> bool:
        """
        Verificar si debe abrirse el breaker
        
        Args:
            current_value: Valor actual a comparar con threshold
            
        Returns:
            True si debe abrirse
        """
        violation = False
        
        if self.breaker_type == BreakerType.LATENCY:
            violation = current_value > self.threshold
        elif self.breaker_type == BreakerType.SPREAD:
            violation = current_value > self.threshold
        elif self.breaker_type == BreakerType.VOLATILITY:
            violation = current_value > self.threshold
        elif self.breaker_type == BreakerType.ERROR_RATE:
            violation = current_value > self.threshold
        elif self.breaker_type == BreakerType.DRAWDOWN:
            violation = current_value > self.threshold
        
        if violation:
            self.consecutive_violations += 1
        else:
            self.consecutive_violations = max(0, self.consecutive_violations - 1)
        
        return self.consecutive_violations >= self.max_consecutive
    
    def open(self, trigger_value: float = None):
        """Abrir circuit breaker"""
        if not self.is_open:
            self.is_open = True
            self.opened_at = datetime.now()
            self.trigger_count += 1
            self.metadata['last_trigger_value'] = trigger_value
            self.metadata['last_opened'] = self.opened_at.isoformat()
            
            logger.warning(
                f"🔴 Circuit breaker OPENED: {self.name} (type: {self.breaker_type.value})",
                extra={
                    'breaker_name': self.name,
                    'breaker_type': self.breaker_type.value,
                    'trigger_value': trigger_value,
                    'threshold': self.threshold,
                    'trigger_count': self.trigger_count
                }
            )
            
            # Ejecutar callback
            if self.on_open_callback:
                try:
                    self.on_open_callback(self)
                except Exception as e:
                    logger.error(f"Error in on_open_callback: {e}")
    
    def can_close(self) -> bool:
        """Verificar si puede cerrarse (cooldown terminado)"""
        if not self.is_open:
            return False
        
        if self.opened_at is None:
            return False
        
        elapsed = (datetime.now() - self.opened_at).total_seconds()
        return elapsed >= self.cooldown_seconds
    
    def close(self):
        """Cerrar circuit breaker"""
        if self.is_open:
            duration = None
            if self.opened_at:
                duration = (datetime.now() - self.opened_at).total_seconds()
            
            self.is_open = False
            self.consecutive_violations = 0
            self.metadata['last_closed'] = datetime.now().isoformat()
            self.metadata['last_duration'] = duration
            
            logger.info(
                f"🟢 Circuit breaker CLOSED: {self.name} (duration: {duration:.0f}s)",
                extra={
                    'breaker_name': self.name,
                    'breaker_type': self.breaker_type.value,
                    'duration_seconds': duration
                }
            )
            
            # Ejecutar callback
            if self.on_close_callback:
                try:
                    self.on_close_callback(self)
                except Exception as e:
                    logger.error(f"Error in on_close_callback: {e}")
            
            self.opened_at = None
    
    def force_close(self):
        """Forzar cierre del breaker (ignora cooldown)"""
        if self.is_open:
            logger.warning(f"⚠️ Force closing circuit breaker: {self.name}")
            self.close()

class CircuitBreakerManager:
    """Gestor centralizado de circuit breakers"""
    
    def __init__(self, config: dict):
        self.config = config
        self.breakers: Dict[str, CircuitBreaker] = {}
        self.exchange_breakers: Dict[str, Dict[str, CircuitBreaker]] = {}
        self._initialize_breakers()
        
        logger.info("Circuit Breaker Manager initialized")
    
    def _initialize_breakers(self):
        """Inicializar breakers desde configuración"""
        cfg = self.config.get("market_maker_v4_2", {})
        
        # Breakers globales
        self.breakers["latency"] = CircuitBreaker(
            name="Global Latency",
            breaker_type=BreakerType.LATENCY,
            threshold=cfg.get("latency_threshold_ms", 500),
            cooldown_seconds=cfg.get("circuit_cooldown_seconds", 300)
        )
        
        self.breakers["spread"] = CircuitBreaker(
            name="Global Spread",
            breaker_type=BreakerType.SPREAD,
            threshold=cfg.get("spread_threshold_bps", 20),
            cooldown_seconds=cfg.get("circuit_cooldown_seconds", 300)
        )
        
        self.breakers["volatility"] = CircuitBreaker(
            name="Global Volatility",
            breaker_type=BreakerType.VOLATILITY,
            threshold=cfg.get("volatility_threshold", 0.05),
            cooldown_seconds=cfg.get("circuit_cooldown_seconds", 300)
        )
        
        self.breakers["error_rate"] = CircuitBreaker(
            name="Global Error Rate",
            breaker_type=BreakerType.ERROR_RATE,
            threshold=cfg.get("error_rate_threshold", 0.1),
            cooldown_seconds=cfg.get("circuit_cooldown_seconds", 300)
        )
        
        self.breakers["drawdown"] = CircuitBreaker(
            name="Global Drawdown",
            breaker_type=BreakerType.DRAWDOWN,
            threshold=cfg.get("drawdown_threshold_bps", 100),
            cooldown_seconds=cfg.get("circuit_cooldown_seconds", 300)
        )
    
    def create_exchange_breaker(self, exchange: str, breaker_type: BreakerType, 
                                threshold: float, cooldown: int) -> CircuitBreaker:
        """Crear breaker específico para un exchange"""
        if exchange not in self.exchange_breakers:
            self.exchange_breakers[exchange] = {}
        
        breaker = CircuitBreaker(
            name=f"{exchange} {breaker_type.value}",
            breaker_type=breaker_type,
            threshold=threshold,
            cooldown_seconds=cooldown
        )
        
        self.exchange_breakers[exchange][breaker_type.value] = breaker
        logger.info(f"Created exchange-specific breaker: {breaker.name}")
        
        return breaker
    
    def check(self, breaker_name: str, current_value: float, 
              exchange: str = None, symbol: str = None):
        """
        Verificar un circuit breaker
        
        Args:
            breaker_name: Nombre del breaker (latency, spread, etc)
            current_value: Valor actual a verificar
            exchange: Exchange opcional para breakers específicos
            symbol: Símbolo opcional para logging
        """
        # Verificar breaker global
        if breaker_name in self.breakers:
            breaker = self.breakers[breaker_name]
            
            # Si ya está abierto, verificar si puede cerrarse
            if breaker.is_open:
                if breaker.can_close():
                    breaker.close()
                return
            
            # Verificar si debe abrirse
            if breaker.should_open(current_value):
                breaker.open(current_value)
        
        # Verificar breaker específico de exchange si existe
        if exchange and exchange in self.exchange_breakers:
            if breaker_name in self.exchange_breakers[exchange]:
                breaker = self.exchange_breakers[exchange][breaker_name]
                
                if breaker.is_open:
                    if breaker.can_close():
                        breaker.close()
                    return
                
                if breaker.should_open(current_value):
                    breaker.open(current_value)
    
    def is_open(self, breaker_name: str, exchange: str = None) -> bool:
        """
        Verificar si un breaker está abierto
        
        Args:
            breaker_name: Nombre del breaker
            exchange: Exchange opcional
            
        Returns:
            True si está abierto
        """
        # Verificar breaker global
        if breaker_name in self.breakers and self.breakers[breaker_name].is_open:
            return True
        
        # Verificar breaker de exchange
        if exchange and exchange in self.exchange_breakers:
            if breaker_name in self.exchange_breakers[exchange]:
                return self.exchange_breakers[exchange][breaker_name].is_open
        
        return False
    
    def get_open_count(self) -> int:
        """Contar breakers abiertos"""
        count = sum(1 for b in self.breakers.values() if b.is_open)
        
        for exchange_breakers in self.exchange_breakers.values():
            count += sum(1 for b in exchange_breakers.values() if b.is_open)
        
        return count
    
    def get_status(self) -> dict:
        """Obtener estado de todos los breakers"""
        status = {
            "global": {
                name: {
                    "is_open": breaker.is_open,
                    "trigger_count": breaker.trigger_count,
                    "opened_at": breaker.opened_at.isoformat() if breaker.opened_at else None,
                    "threshold": breaker.threshold,
                    "metadata": breaker.metadata
                }
                for name, breaker in self.breakers.items()
            },
            "exchanges": {}
        }
        
        for exchange, breakers in self.exchange_breakers.items():
            status["exchanges"][exchange] = {
                name: {
                    "is_open": breaker.is_open,
                    "trigger_count": breaker.trigger_count,
                    "opened_at": breaker.opened_at.isoformat() if breaker.opened_at else None,
                    "threshold": breaker.threshold
                }
                for name, breaker in breakers.items()
            }
        
        return status
    
    def get_open_breakers(self) -> List[CircuitBreaker]:
        """Obtener lista de breakers abiertos"""
        open_breakers = [b for b in self.breakers.values() if b.is_open]
        
        for exchange_breakers in self.exchange_breakers.values():
            open_breakers.extend([b for b in exchange_breakers.values() if b.is_open])
        
        return open_breakers
    
    def close_all(self):
        """Cerrar todos los breakers (emergencia)"""
        logger.warning("🚨 Force closing ALL circuit breakers")
        
        for breaker in self.breakers.values():
            if breaker.is_open:
                breaker.force_close()
        
        for exchange_breakers in self.exchange_breakers.values():
            for breaker in exchange_breakers.values():
                if breaker.is_open:
                    breaker.force_close()

