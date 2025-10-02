"""
Excepciones personalizadas para MarketMaker Pro
"""

class MarketMakerException(Exception):
    """Excepción base para el sistema"""
    pass

class ExchangeConnectionError(MarketMakerException):
    """Error de conexión a exchange"""
    pass

class InsufficientBalanceError(MarketMakerException):
    """Balance insuficiente para la operación"""
    pass

class RiskLimitExceededError(MarketMakerException):
    """Límite de riesgo excedido"""
    pass

class CircuitBreakerOpenError(MarketMakerException):
    """Circuit breaker está abierto, operación bloqueada"""
    pass

class InvalidOrderError(MarketMakerException):
    """Parámetros de orden inválidos"""
    pass

class ConfigurationError(MarketMakerException):
    """Error en la configuración del sistema"""
    pass

class SymbolNotSupportedError(MarketMakerException):
    """Símbolo no soportado en el exchange"""
    pass

