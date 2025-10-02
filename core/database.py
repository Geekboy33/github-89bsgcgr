"""
Sistema de base de datos con SQLAlchemy
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./marketmaker.db")

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Trade(Base):
    """Registro de trades ejecutados"""
    __tablename__ = "trades"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, unique=True, index=True)
    exchange = Column(String, index=True)
    symbol = Column(String, index=True)
    side = Column(String)  # buy/sell
    type = Column(String)  # limit/market
    amount = Column(Float)
    price = Column(Float)
    filled = Column(Float, default=0)
    fee = Column(Float, default=0)
    fee_currency = Column(String, default="USDT")
    pnl = Column(Float, nullable=True)
    status = Column(String, default="open")  # open/filled/canceled/rejected
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    filled_at = Column(DateTime, nullable=True)
    trade_metadata = Column(JSON, nullable=True)

class Position(Base):
    """Registro de posiciones"""
    __tablename__ = "positions"
    
    id = Column(Integer, primary_key=True, index=True)
    exchange = Column(String, index=True)
    symbol = Column(String, index=True)
    side = Column(String)  # long/short
    size = Column(Float)
    entry_price = Column(Float)
    current_price = Column(Float)
    liquidation_price = Column(Float, nullable=True)
    leverage = Column(Float, default=1.0)
    margin = Column(Float)
    unrealized_pnl = Column(Float)
    realized_pnl = Column(Float, default=0)
    opened_at = Column(DateTime, default=datetime.utcnow, index=True)
    closed_at = Column(DateTime, nullable=True)
    is_open = Column(Boolean, default=True, index=True)
    position_metadata = Column(JSON, nullable=True)

class SystemMetric(Base):
    """Métricas del sistema por timestamp"""
    __tablename__ = "system_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    equity = Column(Float)
    total_pnl = Column(Float)
    daily_pnl = Column(Float)
    total_fees = Column(Float)
    open_orders = Column(Integer)
    open_positions = Column(Integer)
    healthy_exchanges = Column(Integer)
    open_circuits = Column(Integer)
    risk_mode = Column(String)
    metric_metadata = Column(JSON, nullable=True)

class CircuitBreakerEvent(Base):
    """Eventos de circuit breakers"""
    __tablename__ = "circuit_breaker_events"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    exchange = Column(String, index=True)
    symbol = Column(String, nullable=True)
    breaker_type = Column(String, index=True)  # latency/spread/volatility/error_rate/drawdown
    trigger_value = Column(Float)
    threshold = Column(Float)
    duration_seconds = Column(Integer)
    resolved_at = Column(DateTime, nullable=True, index=True)
    is_resolved = Column(Boolean, default=False, index=True)
    event_metadata = Column(JSON, nullable=True)

class ExchangeHealth(Base):
    """Historial de salud de exchanges"""
    __tablename__ = "exchange_health"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    exchange = Column(String, index=True)
    connected = Column(Boolean)
    latency_ms = Column(Float)
    success_rate = Column(Float)
    error_count = Column(Integer)
    api_calls_used = Column(Integer)
    api_calls_limit = Column(Integer)
    health_metadata = Column(JSON, nullable=True)

class Alert(Base):
    """Registro de alertas enviadas"""
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    level = Column(String, index=True)  # info/warning/error/critical
    message = Column(Text)
    source = Column(String)  # circuit_breaker/position/order/system
    exchange = Column(String, nullable=True)
    symbol = Column(String, nullable=True)
    sent_telegram = Column(Boolean, default=False)
    sent_at = Column(DateTime, nullable=True)
    alert_metadata = Column(JSON, nullable=True)

class BalanceSnapshot(Base):
    """Snapshots de balance por exchange"""
    __tablename__ = "balance_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    exchange = Column(String, index=True)
    currency = Column(String, index=True)
    free = Column(Float)
    used = Column(Float)
    total = Column(Float)
    usd_value = Column(Float, nullable=True)
    snapshot_metadata = Column(JSON, nullable=True)

# Crear todas las tablas
def init_db():
    """Inicializar base de datos"""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Dependency para FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Inicializar al importar
init_db()

