from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api import deps
from app.models.market import Market
from app.models.market_bookmark import MarketBookmark
from app.models.user import User
from app.schemas.market import MarketResponse

router = APIRouter()

@router.get("/", response_model=List[MarketResponse])
def read_markets(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    bookmarked_only: bool = False,
):
    """
    Retrieve markets with optional filtering by category or bookmarked status.
    """
    query = db.query(Market).filter(Market.status == "open")
    
    if category:
        query = query.filter(Market.category == category)
    
    if bookmarked_only:
        query = query.join(MarketBookmark).filter(MarketBookmark.user_id == current_user.user_id)
        
    markets = query.offset(skip).limit(limit).all()
    
    # Add bookmark status for each market
    result = []
    for market in markets:
        is_bookmarked = db.query(MarketBookmark).filter(
            MarketBookmark.user_id == current_user.user_id,
            MarketBookmark.market_id == market.market_id
        ).first() is not None
        
        market_dict = {
            "market_id": market.market_id,
            "title": market.title,
            "description": market.description,
            "category": market.category,
            "image_url": market.image_url,
            "start_time": market.start_time,
            "close_time": market.close_time,
            "resolve_time": market.resolve_time,
            "status": market.status,
            "result": market.result,
            "is_bookmarked": is_bookmarked,
        }
        result.append(market_dict)
    
    return result

@router.post("/{market_id}/bookmark")
def toggle_market_bookmark(
    market_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Toggle bookmark status for a market.
    """
    market = db.query(Market).filter(Market.market_id == market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")
    
    existing_bookmark = db.query(MarketBookmark).filter(
        MarketBookmark.user_id == current_user.user_id,
        MarketBookmark.market_id == market_id
    ).first()
    
    if existing_bookmark:
        # Remove bookmark
        db.delete(existing_bookmark)
        is_bookmarked = False
    else:
        # Add bookmark
        bookmark = MarketBookmark(user_id=current_user.user_id, market_id=market_id)
        db.add(bookmark)
        is_bookmarked = True
    
    db.commit()
    
    return {
        "is_bookmarked": is_bookmarked
    } 