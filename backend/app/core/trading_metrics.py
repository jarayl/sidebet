"""
Trading Engine Metrics and Monitoring System

This module provides comprehensive metrics collection and monitoring
for the concurrent trading engine to track:
- Order placement performance
- Trade execution latency
- Concurrency conflicts and retries
- System health and resource usage
"""

import time
import threading
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import defaultdict, deque
import logging

logger = logging.getLogger(__name__)

@dataclass
class OrderMetrics:
    """Metrics for a single order placement."""
    order_id: Optional[int]
    user_id: int
    contract_id: int
    side: str
    contract_side: str
    quantity: int
    price: Optional[float]
    start_time: float
    end_time: Optional[float] = None
    success: bool = False
    error: Optional[str] = None
    retries: int = 0
    trades_executed: int = 0
    
    @property
    def duration(self) -> Optional[float]:
        """Calculate order processing duration in seconds."""
        if self.end_time is None:
            return None
        return self.end_time - self.start_time

@dataclass
class TradingEngineMetrics:
    """Comprehensive metrics for the trading engine."""
    
    # Order metrics
    total_orders: int = 0
    successful_orders: int = 0
    failed_orders: int = 0
    
    # Trade metrics
    total_trades: int = 0
    total_volume: int = 0
    
    # Performance metrics
    avg_order_latency: float = 0.0
    p95_order_latency: float = 0.0
    p99_order_latency: float = 0.0
    
    # Concurrency metrics
    total_retries: int = 0
    serialization_conflicts: int = 0
    deadlock_recoveries: int = 0
    
    # System metrics
    active_connections: int = 0
    peak_connections: int = 0
    
    # Recent order history (for calculating percentiles)
    recent_order_durations: deque = field(default_factory=lambda: deque(maxlen=1000))
    
    # Error tracking
    error_counts: Dict[str, int] = field(default_factory=lambda: defaultdict(int))
    
    # Hourly aggregates
    hourly_stats: Dict[str, Dict[str, int]] = field(default_factory=lambda: defaultdict(lambda: defaultdict(int)))

class TradingMetricsCollector:
    """Thread-safe metrics collector for the trading engine."""
    
    def __init__(self):
        self.metrics = TradingEngineMetrics()
        self.lock = threading.RLock()
        self.active_orders: Dict[str, OrderMetrics] = {}
        self.start_time = time.time()
        
        # Performance tracking
        self.latency_buckets = {
            "0-10ms": 0,
            "10-50ms": 0,
            "50-100ms": 0,
            "100-500ms": 0,
            "500ms-1s": 0,
            "1s+": 0
        }
    
    def start_order_tracking(self, user_id: int, contract_id: int, side: str, 
                           contract_side: str, quantity: int, price: Optional[float]) -> str:
        """Start tracking a new order placement."""
        order_key = f"{user_id}_{contract_id}_{time.time()}_{threading.current_thread().ident}"
        
        order_metrics = OrderMetrics(
            order_id=None,
            user_id=user_id,
            contract_id=contract_id,
            side=side,
            contract_side=contract_side,
            quantity=quantity,
            price=price,
            start_time=time.time()
        )
        
        with self.lock:
            self.active_orders[order_key] = order_metrics
            self.metrics.total_orders += 1
        
        return order_key
    
    def complete_order_tracking(self, order_key: str, order_id: Optional[int] = None, 
                              success: bool = True, error: Optional[str] = None,
                              retries: int = 0, trades_executed: int = 0):
        """Complete tracking for an order."""
        with self.lock:
            if order_key not in self.active_orders:
                logger.warning(f"Order key {order_key} not found in active orders")
                return
            
            order_metrics = self.active_orders[order_key]
            order_metrics.end_time = time.time()
            order_metrics.order_id = order_id
            order_metrics.success = success
            order_metrics.error = error
            order_metrics.retries = retries
            order_metrics.trades_executed = trades_executed
            
            # Update aggregate metrics
            if success:
                self.metrics.successful_orders += 1
            else:
                self.metrics.failed_orders += 1
                if error:
                    self.metrics.error_counts[error] += 1
            
            self.metrics.total_retries += retries
            self.metrics.total_trades += trades_executed
            self.metrics.total_volume += order_metrics.quantity * trades_executed
            
            # Track latency
            if order_metrics.duration:
                self.metrics.recent_order_durations.append(order_metrics.duration)
                self._update_latency_buckets(order_metrics.duration)
                self._update_latency_percentiles()
            
            # Track hourly stats
            hour_key = datetime.now().strftime("%Y-%m-%d-%H")
            self.metrics.hourly_stats[hour_key]["orders"] += 1
            self.metrics.hourly_stats[hour_key]["trades"] += trades_executed
            if not success:
                self.metrics.hourly_stats[hour_key]["errors"] += 1
            
            # Remove from active orders
            del self.active_orders[order_key]
    
    def record_serialization_conflict(self):
        """Record a serialization conflict (transaction retry)."""
        with self.lock:
            self.metrics.serialization_conflicts += 1
    
    def record_deadlock_recovery(self):
        """Record a deadlock recovery."""
        with self.lock:
            self.metrics.deadlock_recoveries += 1
    
    def update_connection_count(self, active: int, peak: Optional[int] = None):
        """Update database connection metrics."""
        with self.lock:
            self.metrics.active_connections = active
            if peak is not None:
                self.metrics.peak_connections = max(self.metrics.peak_connections, peak)
    
    def _update_latency_buckets(self, duration: float):
        """Update latency distribution buckets."""
        duration_ms = duration * 1000
        
        if duration_ms < 10:
            self.latency_buckets["0-10ms"] += 1
        elif duration_ms < 50:
            self.latency_buckets["10-50ms"] += 1
        elif duration_ms < 100:
            self.latency_buckets["50-100ms"] += 1
        elif duration_ms < 500:
            self.latency_buckets["100-500ms"] += 1
        elif duration_ms < 1000:
            self.latency_buckets["500ms-1s"] += 1
        else:
            self.latency_buckets["1s+"] += 1
    
    def _update_latency_percentiles(self):
        """Update latency percentile calculations."""
        if not self.metrics.recent_order_durations:
            return
        
        sorted_durations = sorted(self.metrics.recent_order_durations)
        n = len(sorted_durations)
        
        self.metrics.avg_order_latency = sum(sorted_durations) / n
        
        if n >= 20:  # Only calculate percentiles with sufficient data
            p95_idx = int(0.95 * n)
            p99_idx = int(0.99 * n)
            
            self.metrics.p95_order_latency = sorted_durations[p95_idx]
            self.metrics.p99_order_latency = sorted_durations[p99_idx]
    
    def get_current_metrics(self) -> Dict[str, Any]:
        """Get current metrics snapshot."""
        with self.lock:
            uptime = time.time() - self.start_time
            
            return {
                "uptime_seconds": uptime,
                "orders": {
                    "total": self.metrics.total_orders,
                    "successful": self.metrics.successful_orders,
                    "failed": self.metrics.failed_orders,
                    "success_rate": (self.metrics.successful_orders / max(1, self.metrics.total_orders)) * 100,
                    "active": len(self.active_orders)
                },
                "trades": {
                    "total": self.metrics.total_trades,
                    "volume": self.metrics.total_volume,
                    "rate_per_second": self.metrics.total_trades / max(1, uptime)
                },
                "performance": {
                    "avg_latency_ms": self.metrics.avg_order_latency * 1000,
                    "p95_latency_ms": self.metrics.p95_order_latency * 1000,
                    "p99_latency_ms": self.metrics.p99_order_latency * 1000,
                    "latency_distribution": dict(self.latency_buckets)
                },
                "concurrency": {
                    "total_retries": self.metrics.total_retries,
                    "serialization_conflicts": self.metrics.serialization_conflicts,
                    "deadlock_recoveries": self.metrics.deadlock_recoveries,
                    "retry_rate": (self.metrics.total_retries / max(1, self.metrics.total_orders)) * 100
                },
                "system": {
                    "active_connections": self.metrics.active_connections,
                    "peak_connections": self.metrics.peak_connections
                },
                "errors": dict(self.metrics.error_counts),
                "recent_hourly_stats": dict(list(self.metrics.hourly_stats.items())[-24:])  # Last 24 hours
            }
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get system health status."""
        metrics = self.get_current_metrics()
        
        # Define health thresholds
        health_status = "healthy"
        issues = []
        
        # Check error rate
        if metrics["orders"]["success_rate"] < 95:
            health_status = "degraded"
            issues.append(f"Low success rate: {metrics['orders']['success_rate']:.1f}%")
        
        # Check latency
        if metrics["performance"]["p95_latency_ms"] > 1000:
            health_status = "degraded"
            issues.append(f"High P95 latency: {metrics['performance']['p95_latency_ms']:.1f}ms")
        
        # Check retry rate
        if metrics["concurrency"]["retry_rate"] > 10:
            health_status = "degraded"
            issues.append(f"High retry rate: {metrics['concurrency']['retry_rate']:.1f}%")
        
        # Check for critical issues
        if metrics["orders"]["success_rate"] < 80 or metrics["performance"]["p95_latency_ms"] > 5000:
            health_status = "critical"
        
        return {
            "status": health_status,
            "issues": issues,
            "last_updated": datetime.now().isoformat(),
            "summary": {
                "orders_per_second": metrics["orders"]["total"] / max(1, metrics["uptime_seconds"]),
                "avg_latency_ms": metrics["performance"]["avg_latency_ms"],
                "success_rate": metrics["orders"]["success_rate"],
                "active_orders": metrics["orders"]["active"]
            }
        }
    
    def reset_metrics(self):
        """Reset all metrics (useful for testing)."""
        with self.lock:
            self.metrics = TradingEngineMetrics()
            self.active_orders.clear()
            self.start_time = time.time()
            self.latency_buckets = {k: 0 for k in self.latency_buckets}

# Global metrics collector instance
metrics_collector = TradingMetricsCollector()

def get_metrics_collector() -> TradingMetricsCollector:
    """Get the global metrics collector instance."""
    return metrics_collector 