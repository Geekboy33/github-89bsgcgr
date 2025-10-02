"""
Sistema de logging estructurado para MarketMaker Pro
"""

import logging
import sys
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

class StructuredFormatter(logging.Formatter):
    """Formatter que genera logs en formato JSON estructurado"""
    
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        # Agregar campos extras si existen
        if hasattr(record, 'exchange'):
            log_data['exchange'] = record.exchange
        if hasattr(record, 'symbol'):
            log_data['symbol'] = record.symbol
        if hasattr(record, 'order_id'):
            log_data['order_id'] = record.order_id
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        
        # Agregar excepción si existe
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
            log_data['exc_type'] = record.exc_info[0].__name__
        
        return json.dumps(log_data)

class ColoredFormatter(logging.Formatter):
    """Formatter con colores para consola"""
    
    # Códigos de color ANSI
    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Green
        'WARNING': '\033[33m',    # Yellow
        'ERROR': '\033[31m',      # Red
        'CRITICAL': '\033[35m',   # Magenta
    }
    RESET = '\033[0m'
    
    def format(self, record):
        # Agregar color al nivel
        levelname = record.levelname
        if levelname in self.COLORS:
            levelname_color = f"{self.COLORS[levelname]}{levelname:8}{self.RESET}"
            record.levelname = levelname_color
        
        # Formatear mensaje base
        result = super().format(record)
        
        # Restaurar levelname original
        record.levelname = levelname
        
        return result

def get_logger(name: str, log_file: str = None, level=logging.INFO) -> logging.Logger:
    """
    Crear logger con formato estructurado
    
    Args:
        name: Nombre del logger
        log_file: Archivo de log (opcional)
        level: Nivel de logging
    
    Returns:
        Logger configurado
    """
    logger = logging.getLogger(name)
    
    # Evitar duplicados
    if logger.handlers:
        return logger
    
    logger.setLevel(level)
    logger.propagate = False
    
    # Console handler (formato legible con colores)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_format = ColoredFormatter(
        '%(asctime)s | %(levelname)s | %(name)-20s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(console_format)
    logger.addHandler(console_handler)
    
    # File handler (formato JSON estructurado)
    if log_file:
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        
        file_handler = logging.FileHandler(log_dir / log_file, encoding='utf-8')
        file_handler.setLevel(level)
        file_handler.setFormatter(StructuredFormatter())
        logger.addHandler(file_handler)
    
    return logger

# Logger por defecto
default_logger = get_logger("marketmaker", "marketmaker.log")
