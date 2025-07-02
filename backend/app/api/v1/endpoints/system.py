"""
System monitoring and metrics endpoints for the trading engine.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.api import deps
from app.models.user import User
from app.core.trading_metrics import get_metrics_collector

router = APIRouter()

@router.get("/metrics", response_model=Dict[str, Any])
def get_trading_metrics(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """
    Get comprehensive trading engine metrics.
    Requires admin privileges.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can access system metrics"
        )
    
    metrics_collector = get_metrics_collector()
    return metrics_collector.get_current_metrics()

@router.get("/health", response_model=Dict[str, Any])
def get_system_health(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """
    Get system health status.
    Requires admin privileges.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can access system health"
        )
    
    metrics_collector = get_metrics_collector()
    return metrics_collector.get_health_status()

@router.post("/metrics/reset")
def reset_metrics(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """
    Reset all metrics (useful for testing).
    Requires admin privileges.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can reset metrics"
        )
    
    metrics_collector = get_metrics_collector()
    metrics_collector.reset_metrics()
    
    return {"message": "Metrics reset successfully"}

@router.get("/performance/summary")
def get_performance_summary(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """
    Get a simplified performance summary for dashboards.
    Requires admin privileges.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can access performance data"
        )
    
    metrics_collector = get_metrics_collector()
    health = metrics_collector.get_health_status()
    metrics = metrics_collector.get_current_metrics()
    
    return {
        "system_status": health["status"],
        "orders_per_second": health["summary"]["orders_per_second"],
        "success_rate_percent": health["summary"]["success_rate"],
        "average_latency_ms": health["summary"]["avg_latency_ms"],
        "active_orders": health["summary"]["active_orders"],
        "total_trades": metrics["trades"]["total"],
        "retry_rate_percent": metrics["concurrency"]["retry_rate"],
        "issues": health["issues"]
    } 