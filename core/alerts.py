"""
Sistema de alertas para MarketMaker Pro
"""

import aiohttp
import asyncio
from typing import Dict, Any, Optional
from enum import Enum
from datetime import datetime
from core.logger import get_logger

logger = get_logger("alerts", "alerts.log")

class AlertLevel(Enum):
    """Niveles de alerta"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

class AlertManager:
    """Gestor de alertas multi-canal"""
    
    def __init__(self, config: dict):
        self.config = config
        self.alerts_config = config.get("alerts", {})
        self.telegram_config = self.alerts_config.get("telegram", {})
        
        self.enabled = self.alerts_config.get("enabled", False)
        self.min_level = AlertLevel(self.alerts_config.get("min_level", "warning"))
        
        # Throttling para evitar spam
        self.last_alert_times: Dict[str, datetime] = {}
        self.min_alert_interval = 60  # segundos
        
        # Estadísticas
        self.alerts_sent = 0
        self.alerts_throttled = 0
        self.alerts_failed = 0
        
        logger.info(f"Alert Manager initialized (enabled: {self.enabled}, min_level: {self.min_level.value})")
    
    def _should_throttle(self, alert_key: str) -> bool:
        """Verificar si debe hacer throttling de la alerta"""
        if alert_key not in self.last_alert_times:
            return False
        
        elapsed = (datetime.now() - self.last_alert_times[alert_key]).total_seconds()
        return elapsed < self.min_alert_interval
    
    async def send_alert(self, message: str, level: AlertLevel = AlertLevel.INFO, 
                        metadata: Optional[Dict[str, Any]] = None,
                        alert_key: Optional[str] = None):
        """
        Enviar alerta
        
        Args:
            message: Mensaje de la alerta
            level: Nivel de severidad
            metadata: Metadatos adicionales
            alert_key: Key para throttling (evitar duplicados)
        """
        if not self.enabled:
            logger.debug(f"Alerts disabled, skipping: {message}")
            return
        
        # Filtrar por nivel mínimo
        level_order = {
            AlertLevel.INFO: 0,
            AlertLevel.WARNING: 1,
            AlertLevel.ERROR: 2,
            AlertLevel.CRITICAL: 3
        }
        
        if level_order[level] < level_order[self.min_level]:
            logger.debug(f"Alert below min level, skipping: {message}")
            return
        
        # Throttling
        if alert_key and self._should_throttle(alert_key):
            self.alerts_throttled += 1
            logger.debug(f"Alert throttled: {alert_key}")
            return
        
        # Formatear mensaje
        emoji = {
            AlertLevel.INFO: "ℹ️",
            AlertLevel.WARNING: "⚠️",
            AlertLevel.ERROR: "❌",
            AlertLevel.CRITICAL: "🚨"
        }
        
        formatted_message = f"{emoji[level]} **{level.value.upper()}**\n\n{message}"
        
        if metadata:
            formatted_message += "\n\n**Detalles:**"
            for key, value in metadata.items():
                formatted_message += f"\n• {key}: `{value}`"
        
        formatted_message += f"\n\n_Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}_"
        
        # Enviar a canales configurados
        success = False
        
        if self.telegram_config.get("bot_token") and self.telegram_config.get("chat_id"):
            success = await self._send_telegram(formatted_message)
        
        # Actualizar estadísticas
        if success:
            self.alerts_sent += 1
            if alert_key:
                self.last_alert_times[alert_key] = datetime.now()
        else:
            self.alerts_failed += 1
    
    async def _send_telegram(self, message: str) -> bool:
        """Enviar mensaje a Telegram"""
        bot_token = self.telegram_config["bot_token"]
        chat_id = self.telegram_config["chat_id"]
        
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        
        payload = {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "Markdown",
            "disable_web_page_preview": True
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        logger.info("✅ Alert sent to Telegram")
                        return True
                    else:
                        error_text = await response.text()
                        logger.error(f"❌ Failed to send Telegram alert: {response.status} - {error_text}")
                        return False
        except asyncio.TimeoutError:
            logger.error("Telegram alert timeout")
            return False
        except Exception as e:
            logger.error(f"Error sending Telegram alert: {e}")
            return False
    
    # Métodos de conveniencia para alertas específicas
    
    async def alert_circuit_breaker_open(self, breaker_name: str, exchange: str, 
                                        current_value: float, threshold: float):
        """Alerta de circuit breaker abierto"""
        await self.send_alert(
            f"🔴 Circuit Breaker Opened\n\n"
            f"**{breaker_name}** on **{exchange}**\n"
            f"Current: `{current_value:.2f}` > Threshold: `{threshold:.2f}`",
            AlertLevel.WARNING,
            metadata={
                "Exchange": exchange,
                "Breaker": breaker_name,
                "Current": f"{current_value:.2f}",
                "Threshold": f"{threshold:.2f}"
            },
            alert_key=f"cb_open_{breaker_name}_{exchange}"
        )
    
    async def alert_circuit_breaker_closed(self, breaker_name: str, exchange: str):
        """Alerta de circuit breaker cerrado"""
        await self.send_alert(
            f"🟢 Circuit Breaker Closed\n\n"
            f"**{breaker_name}** on **{exchange}** has been resolved",
            AlertLevel.INFO,
            metadata={
                "Exchange": exchange,
                "Breaker": breaker_name
            },
            alert_key=f"cb_close_{breaker_name}_{exchange}"
        )
    
    async def alert_position_opened(self, symbol: str, side: str, size: float, 
                                   entry_price: float, exchange: str):
        """Alerta de posición abierta"""
        await self.send_alert(
            f"📈 Position Opened\n\n"
            f"Symbol: **{symbol}**\n"
            f"Side: **{side.upper()}**\n"
            f"Size: `{size:.4f}`\n"
            f"Entry: `${entry_price:.2f}`",
            AlertLevel.INFO,
            metadata={
                "Exchange": exchange,
                "Symbol": symbol,
                "Side": side,
                "Size": size,
                "Entry Price": entry_price
            }
        )
    
    async def alert_position_closed(self, symbol: str, pnl: float, reason: str, exchange: str):
        """Alerta de posición cerrada"""
        level = AlertLevel.ERROR if pnl < 0 else AlertLevel.INFO
        emoji = "📉" if pnl < 0 else "📈"
        
        await self.send_alert(
            f"{emoji} Position Closed\n\n"
            f"Symbol: **{symbol}**\n"
            f"PnL: **${pnl:.2f}**\n"
            f"Reason: {reason}",
            level,
            metadata={
                "Exchange": exchange,
                "Symbol": symbol,
                "PnL": f"${pnl:.2f}",
                "Reason": reason
            }
        )
    
    async def alert_large_loss(self, symbol: str, loss: float, exchange: str):
        """Alerta de pérdida grande"""
        await self.send_alert(
            f"🚨 LARGE LOSS DETECTED\n\n"
            f"Symbol: **{symbol}**\n"
            f"Loss: **${loss:.2f}**\n"
            f"Exchange: **{exchange}**\n\n"
            f"⚠️ Review immediately!",
            AlertLevel.CRITICAL,
            metadata={
                "Symbol": symbol,
                "Loss": f"${loss:.2f}",
                "Exchange": exchange
            },
            alert_key=f"large_loss_{symbol}_{exchange}"
        )
    
    async def alert_system_startup(self, version: str):
        """Alerta de inicio del sistema"""
        await self.send_alert(
            f"🚀 MarketMaker Pro Started\n\n"
            f"Version: **{version}**\n"
            f"System is now operational",
            AlertLevel.INFO
        )
    
    async def alert_system_shutdown(self, reason: str = "Normal shutdown"):
        """Alerta de apagado del sistema"""
        await self.send_alert(
            f"🛑 MarketMaker Pro Shutdown\n\n"
            f"Reason: {reason}",
            AlertLevel.WARNING
        )
    
    async def alert_exchange_disconnected(self, exchange: str, error: str):
        """Alerta de desconexión de exchange"""
        await self.send_alert(
            f"⚠️ Exchange Disconnected\n\n"
            f"Exchange: **{exchange}**\n"
            f"Error: {error}",
            AlertLevel.WARNING,
            metadata={
                "Exchange": exchange,
                "Error": error
            },
            alert_key=f"exchange_disconnect_{exchange}"
        )
    
    async def alert_exchange_reconnected(self, exchange: str):
        """Alerta de reconexión de exchange"""
        await self.send_alert(
            f"✅ Exchange Reconnected\n\n"
            f"Exchange: **{exchange}**\n"
            f"Connection restored successfully",
            AlertLevel.INFO,
            metadata={
                "Exchange": exchange
            }
        )
    
    async def alert_risk_limit_exceeded(self, limit_type: str, current: float, max_value: float):
        """Alerta de límite de riesgo excedido"""
        await self.send_alert(
            f"🚨 RISK LIMIT EXCEEDED\n\n"
            f"Type: **{limit_type}**\n"
            f"Current: `{current:.2f}`\n"
            f"Maximum: `{max_value:.2f}`\n\n"
            f"⚠️ Trading restricted!",
            AlertLevel.CRITICAL,
            metadata={
                "Limit Type": limit_type,
                "Current": current,
                "Maximum": max_value
            },
            alert_key=f"risk_limit_{limit_type}"
        )
    
    async def alert_system_error(self, error_message: str, exchange: str = None):
        """Alerta de error del sistema"""
        await self.send_alert(
            f"❌ System Error\n\n"
            f"Error: {error_message}",
            AlertLevel.ERROR,
            metadata={"Exchange": exchange} if exchange else None
        )
    
    def get_stats(self) -> dict:
        """Obtener estadísticas de alertas"""
        return {
            "alerts_sent": self.alerts_sent,
            "alerts_throttled": self.alerts_throttled,
            "alerts_failed": self.alerts_failed,
            "enabled": self.enabled,
            "min_level": self.min_level.value
        }

