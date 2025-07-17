from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from decimal import Decimal
from datetime import datetime, timezone
from sqlalchemy import and_, or_
import logging
import os
import uuid
from pathlib import Path

from app.api import deps
from app.models.market import Market
from app.models.contract import Contract
from app.models.market_bookmark import MarketBookmark
from app.models.order import Order
from app.models.position import Position
from app.models.user import User
from app.schemas.market import MarketResponse, MarketCreate, MarketUpdate, ContractResponse
from app.schemas.order import OrderCreate, OrderResponse
from app.core.trading_engine import TradingEngine
from app.models.trade import Trade

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/upload-image")
async def upload_market_image(
    image: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Upload a market image (admin only).
    Returns the image URL that can be used in market creation/update.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can upload market images"
        )
    
    # Validate file type
    if not image.content_type or not image.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Validate file size (10MB limit)
    if image.size and image.size > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be under 10MB"
        )
    
    # Create uploads directory if it doesn't exist
    upload_dir = Path("uploads/market_images")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    file_extension = image.filename.split('.')[-1] if image.filename else 'jpg'
    filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = upload_dir / filename
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            content = await image.read()
            buffer.write(content)
        logger.info(f"Saved market image: {file_path}")
    except Exception as e:
        logger.error(f"Failed to save market image: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save image"
        )
    
    # Return the image URL
    image_url = f"/uploads/market_images/{filename}"
    return {"image_url": image_url}

@router.get("/search", response_model=List[dict])
def search_markets(
    q: str = Query(..., min_length=1, max_length=100),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    limit: int = Query(10, le=20),
):
    """
    Search for markets by title, description, and category with fuzzy matching.
    """
    logger.info(f"Searching for markets with query: '{q}'")
    # Search in both title and category with case-insensitive partial matching
    markets = db.query(Market).options(joinedload(Market.contracts)).filter(
        or_(
            Market.title.ilike(f"%{q}%"),
            Market.description.ilike(f"%{q}%"),
            Market.category.ilike(f"%{q}%")
        )
    ).filter(
        Market.status.in_(["open", "closed"])  # Don't show cancelled markets
    ).limit(limit).all()
    
    logger.info(f"Found {len(markets)} markets in DB for query '{q}'")
    
    # Log raw market titles found
    if markets:
        logger.info(f"Raw market titles found: {[m.title for m in markets]}")
    else:
        logger.info("No markets found in the database for the query.")

    # Sort by relevance
    def relevance_score(market):
        title_lower = market.title.lower()
        description_lower = (market.description or "").lower()
        category_lower = (market.category or "").lower()
        query_lower = q.lower()
        
        # Exact title match
        if title_lower == query_lower:
            return 0
        # Title starts with query
        elif title_lower.startswith(query_lower):
            return 1
        # Category exact match
        elif category_lower == query_lower:
            return 2
        # Title contains query
        elif query_lower in title_lower:
            return 3
        # Description contains query
        elif query_lower in description_lower:
            return 4
        # Category contains query
        elif query_lower in category_lower:
            return 5
        else:
            return 6
    
    markets.sort(key=relevance_score)
    
    # Log titles after sorting
    if markets:
        logger.info(f"Market titles after sorting: {[m.title for m in markets]}")

    # Get trade volume for display
    result = []
    for market in markets:
        # Calculate total trade volume across all contracts in the market
        total_volume = 0
        if market.contracts:
            for contract in market.contracts:
                # Count all trades for this contract (both YES and NO sides)
                trades_count = db.query(Trade).filter(Trade.contract_id == contract.contract_id).count()
                total_volume += trades_count
        
        result.append({
            "market_id": market.market_id,
            "title": market.title,
            "category": market.category,
            "status": market.status,
            "close_time": market.close_time,
            "image_url": market.image_url,
            "trade_volume": total_volume
        })
    
    return result

@router.post("/", response_model=MarketResponse)
async def create_market(
    title: str = Form(...),
    description: str = Form(""),
    category: str = Form(...),
    start_time: str = Form(...),
    close_time: str = Form(...),
    resolve_time: str = Form(""),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Create a new market with image upload (admin only).
    Creates a default contract. Use /with-contracts for custom contracts.
    """
    # Check if user is admin
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create markets"
        )
    
    # Handle image upload
    image_url = None
    if image:
        # Validate file type
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )
        
        # Validate file size (10MB limit)
        if image.size and image.size > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size must be under 10MB"
            )
        
        # Create uploads directory if it doesn't exist
        upload_dir = Path("uploads/market_images")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_extension = image.filename.split('.')[-1] if image.filename else 'jpg'
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = upload_dir / filename
        
        # Save file
        try:
            with open(file_path, "wb") as buffer:
                content = await image.read()
                buffer.write(content)
            logger.info(f"Saved market image: {file_path}")
            image_url = f"/uploads/market_images/{filename}"
        except Exception as e:
            logger.error(f"Failed to save market image: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save image"
            )
    
    # Parse datetime strings
    try:
        start_time_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        close_time_dt = datetime.fromisoformat(close_time.replace('Z', '+00:00'))
        resolve_time_dt = None
        if resolve_time:
            resolve_time_dt = datetime.fromisoformat(resolve_time.replace('Z', '+00:00'))
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid datetime format: {str(e)}"
        )
    
    # Create market
    market = Market(
        title=title,
        description=description,
        category=category,
        image_url=image_url,
        start_time=start_time_dt,
        close_time=close_time_dt,
        resolve_time=resolve_time_dt,
        status="open"
    )
    db.add(market)
    db.flush()  # Get market ID
    
    # Create a default contract
    default_contract = Contract(
        market_id=market.market_id,
        title="Default Contract",
        description="Default contract for this market",
        status="open"
    )
    db.add(default_contract)
    
    db.commit()
    db.refresh(market)
    db.refresh(default_contract)
    
    # Format response
    contract_responses = [
        ContractResponse(
            contract_id=default_contract.contract_id,
            title=default_contract.title,
            description=default_contract.description,
            status=default_contract.status,
            resolution=default_contract.resolution,
            yes_price="No price",
            no_price="No price",
            yes_volume=0,
            no_volume=0
        )
    ]
    
    return MarketResponse(
        market_id=market.market_id,
        title=market.title,
        description=market.description,
        category=market.category,
        image_url=market.image_url,
        start_time=market.start_time,
        close_time=market.close_time,
        resolve_time=market.resolve_time,
        status=market.status,
        result=market.result,
        is_bookmarked=False,
        contracts=contract_responses
    )

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
    query = db.query(Market).options(joinedload(Market.contracts)).filter(Market.status == "open")
    
    if category:
        query = query.filter(Market.category == category)
    
    if bookmarked_only:
        query = query.join(
            MarketBookmark, Market.market_id == MarketBookmark.market_id
        ).filter(MarketBookmark.user_id == current_user.user_id)
        
    markets = query.offset(skip).limit(limit).all()
    
    # Initialize trading engine for price calculations
    trading_engine = TradingEngine(db)
    
    # Add bookmark status and contract info for each market
    result = []
    for market in markets:
        is_bookmarked = db.query(MarketBookmark).filter(
            MarketBookmark.user_id == current_user.user_id,
            MarketBookmark.market_id == market.market_id
        ).first() is not None
        
        # Get contract information with real pricing from order book
        contracts = []
        for contract in market.contracts:
            # Get real market statistics for both sides
            yes_stats = trading_engine.get_contract_stats(contract.contract_id, "YES")
            no_stats = trading_engine.get_contract_stats(contract.contract_id, "NO")
            
            # Format prices using best ask prices (for YES/NO buttons)
            yes_price = "No price"
            no_price = "No price"
            
            # Use best ask price (lowest sell order) for each side
            if yes_stats["best_ask_price"] is not None:
                yes_price = f"{int(yes_stats['best_ask_price'] * 100)}¢"
            
            if no_stats["best_ask_price"] is not None:
                no_price = f"{int(no_stats['best_ask_price'] * 100)}¢"
            
            contracts.append(ContractResponse(
                contract_id=contract.contract_id,
                title=contract.title,
                description=contract.description,
                status=contract.status,
                resolution=contract.resolution,
                yes_price=yes_price,
                no_price=no_price,
                yes_volume=yes_stats['total_volume'],
                no_volume=no_stats['total_volume']
            ))
        
        market_dict = MarketResponse(
            market_id=market.market_id,
            title=market.title,
            description=market.description,
            category=market.category,
            image_url=market.image_url,
            start_time=market.start_time,
            close_time=market.close_time,
            resolve_time=market.resolve_time,
            status=market.status,
            result=market.result,
            is_bookmarked=is_bookmarked,
            contracts=contracts
        )
        result.append(market_dict)
    
    return result

@router.post("/with-contracts", response_model=MarketResponse)
def create_market_with_contracts(
    market_in: MarketCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Create a new market with contracts using JSON payload (admin only).
    Use this when you need to specify contracts.
    """
    # Check if user is admin
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create markets"
        )
    
    # Create market
    market = Market(
        title=market_in.title,
        description=market_in.description,
        category=market_in.category,
        image_url=market_in.image_url,
        start_time=market_in.start_time,
        close_time=market_in.close_time,
        resolve_time=market_in.resolve_time,
        status="open"
    )
    db.add(market)
    db.flush()  # Get market ID
    
    # Create contracts for each option
    contracts = []
    for contract_option in market_in.contracts:
        contract = Contract(
            market_id=market.market_id,
            title=contract_option.title,
            description=contract_option.description,
            status="open"
        )
        db.add(contract)
        contracts.append(contract)
    
    db.commit()
    db.refresh(market)
    
    # Refresh contracts to get IDs
    for contract in contracts:
        db.refresh(contract)
    
    # Format response
    contract_responses = []
    for contract in contracts:
        contract_responses.append(ContractResponse(
            contract_id=contract.contract_id,
            title=contract.title,
            description=contract.description,
            status=contract.status,
            resolution=contract.resolution,
            yes_price="No price",
            no_price="No price",
            yes_volume=0,
            no_volume=0
        ))
    
    return MarketResponse(
        market_id=market.market_id,
        title=market.title,
        description=market.description,
        category=market.category,
        image_url=market.image_url,
        start_time=market.start_time,
        close_time=market.close_time,
        resolve_time=market.resolve_time,
        status=market.status,
        result=market.result,
        is_bookmarked=False,
        contracts=contract_responses
    )

@router.put("/{market_id}", response_model=MarketResponse)
async def update_market(
    market_id: int,
    title: str = Form(...),
    description: str = Form(""),
    category: str = Form(...),
    start_time: str = Form(...),
    close_time: str = Form(...),
    resolve_time: str = Form(""),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Update an existing market (admin only).
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update markets"
        )
    
    market = db.query(Market).filter(Market.market_id == market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")
    
    # Handle image upload
    if image:
        # Validate file type
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )
        
        # Validate file size (10MB limit)
        if image.size and image.size > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size must be under 10MB"
            )
        
        # Create uploads directory if it doesn't exist
        upload_dir = Path("uploads/market_images")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_extension = image.filename.split('.')[-1] if image.filename else 'jpg'
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = upload_dir / filename
        
        # Save file
        try:
            with open(file_path, "wb") as buffer:
                content = await image.read()
                buffer.write(content)
            logger.info(f"Saved market image: {file_path}")
            market.image_url = f"/uploads/market_images/{filename}"
        except Exception as e:
            logger.error(f"Failed to save market image: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save image"
            )
    
    # Parse datetime strings
    try:
        start_time_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        close_time_dt = datetime.fromisoformat(close_time.replace('Z', '+00:00'))
        resolve_time_dt = None
        if resolve_time:
            resolve_time_dt = datetime.fromisoformat(resolve_time.replace('Z', '+00:00'))
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid datetime format: {str(e)}"
        )
    
    # Update market fields
    market.title = title
    market.description = description
    market.category = category
    market.start_time = start_time_dt
    market.close_time = close_time_dt
    market.resolve_time = resolve_time_dt
    
    db.commit()
    db.refresh(market)
    
    # Format the response
    trading_engine = TradingEngine(db)
    contract_responses = []
    for contract in market.contracts:
        yes_stats = trading_engine.get_contract_stats(contract.contract_id, "YES")
        no_stats = trading_engine.get_contract_stats(contract.contract_id, "NO")
        
        contract_responses.append(ContractResponse(
            contract_id=contract.contract_id,
            title=contract.title,
            description=contract.description,
            status=contract.status,
            resolution=contract.resolution,
            yes_price=f"{int(yes_stats['best_ask_price'] * 100)}¢" if yes_stats['best_ask_price'] else "No price",
            no_price=f"{int(no_stats['best_ask_price'] * 100)}¢" if no_stats['best_ask_price'] else "No price",
            yes_volume=yes_stats['total_volume'],
            no_volume=no_stats['total_volume']
        ))
        
    return MarketResponse(
        market_id=market.market_id,
        title=market.title,
        description=market.description,
        category=market.category,
        image_url=market.image_url,
        start_time=market.start_time,
        close_time=market.close_time,
        resolve_time=market.resolve_time,
        status=market.status,
        result=market.result,
        is_bookmarked=False,  # You might want to fetch this
        contracts=contract_responses
    )

@router.get("/{market_id}", response_model=dict)
def get_market_details(
    market_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Get detailed market information including contracts and order book.
    """
    market = db.query(Market).filter(Market.market_id == market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")
    
    # Get contracts
    contracts = db.query(Contract).filter(Contract.market_id == market_id).all()
    
    # Get order books and pricing for each contract (both YES and NO sides)
    trading_engine = TradingEngine(db)
    contract_data = []
    
    for contract in contracts:
        # Get stats for both YES and NO sides
        yes_stats = trading_engine.get_contract_stats(contract.contract_id, "YES")
        no_stats = trading_engine.get_contract_stats(contract.contract_id, "NO")
        
        contract_data.append({
            "contract_id": contract.contract_id,
            "title": contract.title,
            "description": contract.description,
            "status": contract.status,
            "resolution": contract.resolution,
            "yes_stats": yes_stats,
            "no_stats": no_stats
        })
    
    # Check if bookmarked
    is_bookmarked = db.query(MarketBookmark).filter(
        MarketBookmark.user_id == current_user.user_id,
        MarketBookmark.market_id == market_id
    ).first() is not None
    
    return {
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
        "contracts": contract_data
    }

@router.post("/{market_id}/orders", response_model=OrderResponse)
def place_order(
    market_id: int,
    order_data: OrderCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Place a buy or sell order for a specific side (YES/NO) of a market contract.
    """
    # Verify market exists and is open
    market = db.query(Market).filter(Market.market_id == market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")
    
    if market.status != "open":
        raise HTTPException(status_code=400, detail="Market is not open for trading")
    
    current_time = datetime.now(timezone.utc)
    if current_time > market.close_time:
        raise HTTPException(status_code=400, detail="Market trading has closed")
    
    # Verify contract belongs to this market
    contract = db.query(Contract).filter(
        Contract.contract_id == order_data.contract_id,
        Contract.market_id == market_id
    ).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found in this market")
    
    if contract.status != "open":
        raise HTTPException(status_code=400, detail="Contract is not open for trading")
    
    try:
        trading_engine = TradingEngine(db)
        order = trading_engine.place_order(
            user_id=current_user.user_id,
            contract_id=order_data.contract_id,
            side=order_data.side,
            contract_side=order_data.contract_side,
            order_type=order_data.order_type,
            price=order_data.price,
            quantity=order_data.quantity
        )
        
        return {
            "order_id": order.order_id,
            "user_id": order.user_id,
            "contract_id": order.contract_id,
            "side": order.side,
            "contract_side": order.contract_side,
            "order_type": order.order_type,
            "price": order.price,
            "quantity": order.quantity,
            "filled_quantity": order.filled_quantity,
            "status": order.status,
            "created_at": order.created_at
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{market_id}/orders", response_model=List[OrderResponse])
def get_user_orders(
    market_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Get user's orders for a specific market.
    """
    # Get contracts for this market
    contracts = db.query(Contract).filter(Contract.market_id == market_id).all()
    contract_ids = [c.contract_id for c in contracts]
    
    # Get user's orders for these contracts
    orders = db.query(Order).filter(
        Order.user_id == current_user.user_id,
        Order.contract_id.in_(contract_ids)
    ).order_by(Order.created_at.desc()).all()
    
    return [
        {
            "order_id": order.order_id,
            "user_id": order.user_id,
            "contract_id": order.contract_id,
            "side": order.side,
            "order_type": order.order_type,
            "price": order.price,
            "quantity": order.quantity,
            "filled_quantity": order.filled_quantity,
            "status": order.status,
            "created_at": order.created_at
        }
        for order in orders
    ]

@router.delete("/orders/{order_id}")
def cancel_order(
    order_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Cancel an open order.
    """
    trading_engine = TradingEngine(db)
    success = trading_engine.cancel_order(order_id, current_user.user_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Order not found or cannot be cancelled")
    
    return {"message": "Order cancelled successfully"}

@router.put("/{market_id}/resolve")
def resolve_market(
    market_id: int,
    result: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Resolve a market (admin only).
    Updates market status, processes payouts for all users with positions, and closes all orders.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can resolve markets"
        )
    
    if result not in ["YES", "NO", "UNDECIDED"]:
        raise HTTPException(status_code=400, detail="Result must be YES, NO, or UNDECIDED")
    
    market = db.query(Market).filter(Market.market_id == market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")
    
    if market.status == "resolved":
        raise HTTPException(status_code=400, detail="Market is already resolved")
    
    try:
        # Update market status
        market.status = "resolved"
        market.result = result
        market.resolve_time = datetime.now(timezone.utc)
        
        # Get all contracts for this market
        contracts = db.query(Contract).filter(Contract.market_id == market_id).all()
        contract_ids = [c.contract_id for c in contracts]
        
        if contract_ids:
            # Cancel all open orders first
            affected_orders = db.query(Order).filter(
                Order.contract_id.in_(contract_ids),
                Order.status.in_(["open", "partially_filled"])
            ).update(
                {"status": "market_closed"},
                synchronize_session=False
            )
            
            # Update all contracts to resolved status with the same result
            db.query(Contract).filter(
                Contract.contract_id.in_(contract_ids)
            ).update(
                {"status": "resolved", "resolution": result},
                synchronize_session=False
            )
            
            # Commit the status changes first
            db.commit()
            
            # Now process payouts using the trading engine
            trading_engine = TradingEngine(db)
            trading_engine.process_market_resolution(market)
            
            logger.info(f"Market {market_id} resolved with result: {result}. Payouts processed.")
        
        # Get final statistics
        affected_positions = db.query(Position).filter(
            Position.contract_id.in_(contract_ids),
            Position.is_active == False
        ).count() if contract_ids else 0
        
        return {
            "message": f"Market resolved with result: {result}. Payouts processed automatically.",
            "affected_orders": affected_orders if contract_ids else 0,
            "affected_positions": affected_positions,
            "contracts_resolved": len(contract_ids),
            "payouts_processed": True
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error resolving market {market_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to resolve market: {str(e)}"
        )

@router.put("/{market_id}/contracts/{contract_id}/resolve")
def resolve_contract(
    market_id: int,
    contract_id: int,
    resolution_data: dict,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Resolve an individual contract within a market (admin only).
    Allows for granular resolution when different contracts have different outcomes.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can resolve contracts"
        )
    
    result = resolution_data.get("resolution")
    if result not in ["YES", "NO", "UNDECIDED"]:
        raise HTTPException(status_code=400, detail="Resolution must be YES, NO, or UNDECIDED")
    
    # Verify the market and contract exist and are related
    market = db.query(Market).filter(Market.market_id == market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")
    
    contract = db.query(Contract).filter(
        Contract.contract_id == contract_id,
        Contract.market_id == market_id
    ).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found in this market")
    
    if contract.status == "resolved":
        raise HTTPException(status_code=400, detail="Contract is already resolved")
    
    try:
        # Update contract status
        contract.status = "resolved"
        contract.resolution = result
        
        # Cancel all open orders for this contract
        affected_orders = db.query(Order).filter(
            Order.contract_id == contract_id,
            Order.status.in_(["open", "partially_filled"])
        ).update(
            {"status": "market_closed"},
            synchronize_session=False
        )
        
        # Commit the status changes
        db.commit()
        
        # Process payouts for this specific contract
        trading_engine = TradingEngine(db)
        trading_engine._payout_contract(contract, result)
        
        # Check if all contracts in the market are now resolved
        remaining_contracts = db.query(Contract).filter(
            Contract.market_id == market_id,
            Contract.status != "resolved"
        ).count()
        
        # If all contracts are resolved, mark the market as resolved
        if remaining_contracts == 0:
            market.status = "resolved"
            market.resolve_time = datetime.now(timezone.utc)
            # Don't set a single market result since contracts may have different outcomes
            db.commit()
        
        logger.info(f"Contract {contract_id} in market {market_id} resolved with result: {result}")
        
        return {
            "message": f"Contract '{contract.title}' resolved with result: {result}",
            "affected_orders": affected_orders,
            "contract_id": contract_id,
            "resolution": result,
            "market_fully_resolved": remaining_contracts == 0,
            "payouts_processed": True
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error resolving contract {contract_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to resolve contract: {str(e)}"
        )

@router.put("/{market_id}/close")
def close_market(
    market_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Close a market (admin only).
    This stops trading but doesn't resolve the market yet.
    Efficiently cancels all open orders.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can close markets"
        )
    
    market = db.query(Market).filter(Market.market_id == market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")
    
    if market.status != "open":
        raise HTTPException(status_code=400, detail="Market is not open")
    
    # Update market status
    market.status = "closed"
    
    # Get all contracts for this market
    contracts = db.query(Contract).filter(Contract.market_id == market_id).all()
    contract_ids = [c.contract_id for c in contracts]
    
    if contract_ids:
        # Efficiently cancel all open orders
        db.query(Order).filter(
            Order.contract_id.in_(contract_ids),
            Order.status.in_(["open", "partially_filled"])
        ).update(
            {"status": "market_closed"},
            synchronize_session=False
        )
        
        # Update all contracts to closed status
        db.query(Contract).filter(
            Contract.contract_id.in_(contract_ids)
        ).update(
            {"status": "closed"},
            synchronize_session=False
        )
    
    db.commit()
    
    # Log the closure for debugging
    affected_orders = db.query(Order).filter(
        Order.contract_id.in_(contract_ids),
        Order.status == "market_closed"
    ).count() if contract_ids else 0
    
    return {
        "message": "Market closed successfully",
        "affected_orders": affected_orders,
        "contracts_closed": len(contract_ids)
    }

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

@router.get("/{market_id}/price-history", response_model=dict)
def get_market_price_history(
    market_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Get historical price data for all contracts in a market.
    Returns trade data that can be used to plot price charts.
    """
    market = db.query(Market).filter(Market.market_id == market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")
    
    # Get all contracts for this market
    contracts = db.query(Contract).filter(Contract.market_id == market_id).all()
    
    # Get trade data for each contract
    contract_data = []
    for contract in contracts:
        # Get trades for YES side only (since NO = 1 - YES)
        trades = db.query(Trade).join(Order, Trade.buy_order_id == Order.order_id).filter(
            and_(
                Trade.contract_id == contract.contract_id,
                Order.contract_side == "YES"
            )
        ).order_by(Trade.executed_at.asc()).all()
        
        # Convert trades to price points
        price_points = []
        for trade in trades:
            price_points.append({
                "timestamp": trade.executed_at.isoformat(),
                "price": float(trade.price),
                "volume": trade.quantity
            })
        
        contract_data.append({
            "contract_id": contract.contract_id,
            "title": contract.title,
            "description": contract.description,
            "price_history": price_points
        })
    
    return {
        "market_id": market_id,
        "market_title": market.title,
        "contracts": contract_data
    }

@router.get("/{market_id}/market-prices", response_model=dict)
def get_market_prices(
    market_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Get current market prices (midpoint between highest YES buy and lowest YES sell) 
    for all contracts in a market. Used for market cards and probability displays.
    """
    market = db.query(Market).filter(Market.market_id == market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")
    
    trading_engine = TradingEngine(db)
    market_prices = trading_engine.get_market_prices_for_market(market_id)
    
    # Get contract details
    contracts = db.query(Contract).filter(Contract.market_id == market_id).all()
    
    result = []
    for contract in contracts:
        market_price = market_prices.get(contract.contract_id)
        result.append({
            "contract_id": contract.contract_id,
            "title": contract.title,
            "market_price": float(market_price) if market_price else None,
            "market_price_percent": int(market_price * 100) if market_price else None
        })
    
    return {
        "market_id": market_id,
        "contracts": result
    } 