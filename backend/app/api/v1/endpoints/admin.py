"""
Admin-specific API endpoints for system administration.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, and_, or_
from typing import List, Optional
from datetime import datetime, timezone, timedelta

from app.api import deps
from app.models.user import User
from app.models.market import Market
from app.models.contract import Contract
from app.models.order import Order
from app.models.trade import Trade
from app.models.position import Position
from app.models.idea import Idea
from app.schemas.user import UserResponse

router = APIRouter()

@router.get("/users/search")
def search_users_admin(
    q: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(50, le=100),
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """Search users with admin privileges."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can search users"
        )
    
    users = db.query(User).filter(
        or_(
            User.username.ilike(f"%{q}%"),
            User.email.ilike(f"%{q}%")
        )
    ).limit(limit).all()
    
    return users

@router.get("/users/stats")
def get_user_statistics(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """Get comprehensive user statistics."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view user statistics"
        )
    
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    verified_users = db.query(User).filter(User.is_verified == True).count()
    admin_users = db.query(User).filter(User.is_superuser == True).count()
    
    # Users registered in the last 30 days
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    new_users = db.query(User).filter(User.created_at >= thirty_days_ago).count()
    
    # Total balance across all users
    total_balance = db.query(func.sum(User.balance)).scalar() or 0
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "verified_users": verified_users,
        "admin_users": admin_users,
        "new_users_30d": new_users,
        "total_balance": total_balance,
        "average_balance": total_balance / max(1, total_users)
    }

@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    status_data: dict,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """Update user status (active/suspended)."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update user status"
        )
    
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent admin from deactivating themselves
    if user_id == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify your own status"
        )
    
    if "is_active" in status_data:
        user.is_active = status_data["is_active"]
    
    if "status" in status_data:
        user.status = status_data["status"]
    
    db.commit()
    db.refresh(user)
    
    return {"message": f"User status updated successfully", "user": user}

@router.put("/users/{user_id}/admin")
def toggle_admin_status(
    user_id: int,
    admin_data: dict,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """Grant or revoke admin privileges."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can modify admin privileges"
        )
    
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent admin from removing their own admin status
    if user_id == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify your own admin status"
        )
    
    user.is_superuser = admin_data.get("is_superuser", False)
    db.commit()
    db.refresh(user)
    
    action = "granted" if user.is_superuser else "revoked"
    return {"message": f"Admin privileges {action} successfully", "user": user}

@router.post("/users/{user_id}/balance")
def adjust_user_balance(
    user_id: int,
    balance_data: dict,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """Adjust user balance (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can adjust user balances"
        )
    
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    amount = balance_data.get("amount", 0)
    operation = balance_data.get("operation", "add")  # "add" or "set"
    reason = balance_data.get("reason", "Admin adjustment")
    
    old_balance = user.balance
    
    if operation == "add":
        user.balance += amount
    elif operation == "set":
        user.balance = amount
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Operation must be 'add' or 'set'"
        )
    
    # Ensure balance doesn't go negative
    if user.balance < 0:
        user.balance = 0
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": f"Balance adjusted successfully",
        "old_balance": old_balance,
        "new_balance": user.balance,
        "adjustment": user.balance - old_balance,
        "reason": reason
    }

@router.get("/markets/stats")
def get_market_statistics(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """Get comprehensive market statistics."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view market statistics"
        )
    
    total_markets = db.query(Market).count()
    open_markets = db.query(Market).filter(Market.status == "open").count()
    closed_markets = db.query(Market).filter(Market.status == "closed").count()
    resolved_markets = db.query(Market).filter(Market.status == "resolved").count()
    
    # Markets created in the last 30 days
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    new_markets = db.query(Market).filter(Market.start_time >= thirty_days_ago).count()
    
    # Total trading volume
    total_trades = db.query(Trade).count()
    total_volume = db.query(func.sum(Trade.quantity * Trade.price)).scalar() or 0
    
    # Average market duration
    resolved_markets_with_duration = db.query(Market).filter(
        and_(
            Market.status == "resolved",
            Market.resolve_time.isnot(None)
        )
    ).all()
    
    avg_duration_hours = 0
    if resolved_markets_with_duration:
        total_duration = sum([
            (market.resolve_time - market.start_time).total_seconds() / 3600
            for market in resolved_markets_with_duration
        ])
        avg_duration_hours = total_duration / len(resolved_markets_with_duration)
    
    return {
        "total_markets": total_markets,
        "open_markets": open_markets,
        "closed_markets": closed_markets,
        "resolved_markets": resolved_markets,
        "new_markets_30d": new_markets,
        "total_trades": total_trades,
        "total_volume": float(total_volume),
        "avg_duration_hours": avg_duration_hours
    }

@router.get("/dashboard/overview")
def get_admin_dashboard_overview(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """Get overview data for admin dashboard."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view dashboard overview"
        )
    
    # User metrics
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # Market metrics
    total_markets = db.query(Market).count()
    active_markets = db.query(Market).filter(Market.status == "open").count()
    
    # Trading metrics
    total_trades = db.query(Trade).count()
    total_orders = db.query(Order).count()
    active_orders = db.query(Order).filter(Order.status.in_(["open", "partially_filled"])).count()
    
    # Volume metrics
    total_volume = db.query(func.sum(Trade.quantity * Trade.price)).scalar() or 0
    total_balance = db.query(func.sum(User.balance)).scalar() or 0
    
    # Recent activity (last 24 hours)
    yesterday = datetime.now(timezone.utc) - timedelta(hours=24)
    recent_users = db.query(User).filter(User.created_at >= yesterday).count()
    recent_markets = db.query(Market).filter(Market.start_time >= yesterday).count()
    recent_trades = db.query(Trade).filter(Trade.executed_at >= yesterday).count()
    
    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "recent_24h": recent_users
        },
        "markets": {
            "total": total_markets,
            "active": active_markets,
            "recent_24h": recent_markets
        },
        "trading": {
            "total_trades": total_trades,
            "total_orders": total_orders,
            "active_orders": active_orders,
            "recent_trades_24h": recent_trades,
            "total_volume": float(total_volume),
            "total_balance": total_balance
        }
    }

@router.get("/activity/recent")
def get_recent_activity(
    limit: int = Query(20, le=100),
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """Get recent system activity for admin dashboard."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can view system activity"
        )
    
    activities = []
    
    # Recent user registrations
    recent_users = db.query(User).order_by(desc(User.created_at)).limit(5).all()
    for user in recent_users:
        activities.append({
            "type": "user_registered",
            "message": f"New user registered: {user.email}",
            "timestamp": user.created_at,
            "user": "system",
            "details": {"user_id": user.user_id, "username": user.username}
        })
    
    # Recent market creations
    recent_markets = db.query(Market).order_by(desc(Market.start_time)).limit(5).all()
    for market in recent_markets:
        activities.append({
            "type": "market_created",
            "message": f"New market created: {market.title}",
            "timestamp": market.start_time,
            "user": "admin",
            "details": {"market_id": market.market_id, "category": market.category}
        })
    
    # Recent market resolutions
    recent_resolved = db.query(Market).filter(
        Market.status == "resolved"
    ).order_by(desc(Market.resolve_time)).limit(5).all()
    for market in recent_resolved:
        activities.append({
            "type": "market_resolved",
            "message": f"Market resolved: {market.title} -> {market.result}",
            "timestamp": market.resolve_time,
            "user": "admin",
            "details": {"market_id": market.market_id, "result": market.result}
        })
    
    # Sort by timestamp and limit
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    return activities[:limit]

@router.delete("/users/{user_id}")
def delete_user_admin(
    user_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """Delete a user account (admin only)."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete users"
        )
    
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent admin from deleting themselves
    if user_id == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    # Store user info for response
    username = user.username
    email = user.email
    
    # Delete user (cascade will handle related data)
    db.delete(user)
    db.commit()
    
    return {
        "message": f"User {username} ({email}) deleted successfully",
        "deleted_user_id": user_id
    } 