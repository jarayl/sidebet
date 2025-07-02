from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.api import deps
from app.models.order import Order
from app.models.contract import Contract
from app.models.market import Market
from app.models.user import User
from app.schemas.order import OrderResponse
from app.core.trading_engine import TradingEngine

router = APIRouter()

@router.get("/", response_model=List[dict])
def get_user_orders(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    status: Optional[str] = None,
    market_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
):
    """
    Get user's orders across all markets with optional filtering.
    """
    query = db.query(Order).options(
        joinedload(Order.contract).joinedload(Contract.market)
    ).filter(
        Order.user_id == current_user.user_id,
        Order.status.in_(["open", "partially_filled"])  # Only show active orders
    )
    
    if status:
        query = query.filter(Order.status == status)
    
    if market_id:
        query = query.join(Contract).filter(Contract.market_id == market_id)
    
    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for order in orders:
        result.append({
            "order_id": order.order_id,
            "user_id": order.user_id,
            "contract_id": order.contract_id,
            "side": order.side,
            "contract_side": order.contract_side,
            "order_type": order.order_type,
            "price": str(order.price) if order.price else None,
            "quantity": order.quantity,
            "filled_quantity": order.filled_quantity,
            "status": order.status,
            "created_at": order.created_at,
            "contract": {
                "contract_id": order.contract.contract_id,
                "title": order.contract.title,
                "market": {
                    "market_id": order.contract.market.market_id,
                    "title": order.contract.market.title,
                    "category": order.contract.market.category,
                    "status": order.contract.market.status
                }
            }
        })
    
    return result

@router.delete("/{order_id}")
def cancel_order(
    order_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Cancel a specific order.
    """
    trading_engine = TradingEngine(db)
    success = trading_engine.cancel_order(order_id, current_user.user_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Order not found or cannot be cancelled")
    
    return {"message": "Order cancelled successfully"}

@router.get("/{order_id}", response_model=dict)
def get_order_details(
    order_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Get details of a specific order.
    """
    order = db.query(Order).options(
        joinedload(Order.contract).joinedload(Contract.market)
    ).filter(
        Order.order_id == order_id,
        Order.user_id == current_user.user_id
    ).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {
        "order_id": order.order_id,
        "user_id": order.user_id,
        "contract_id": order.contract_id,
        "side": order.side,
        "contract_side": order.contract_side,
        "order_type": order.order_type,
        "price": str(order.price) if order.price else None,
        "quantity": order.quantity,
        "filled_quantity": order.filled_quantity,
        "status": order.status,
        "created_at": order.created_at,
        "contract": {
            "contract_id": order.contract.contract_id,
            "title": order.contract.title,
            "market": {
                "market_id": order.contract.market.market_id,
                "title": order.contract.market.title,
                "category": order.contract.market.category,
                "status": order.contract.market.status
            }
        }
    } 