from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import os
import uuid
from pathlib import Path
import logging

from app.models.user import User
from app.models.position import Position
from app.models.contract import Contract
from app.models.market import Market
from app.schemas.user import UserResponse, UserProfile, UserProfileUpdate, PasswordUpdate, UserCreate
from app.schemas.auth import UserResponse as AuthUserResponse
from app.api import deps
from app.core import security

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
def read_users(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
):
    """
    Retrieve users (admin only).
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.post("/", response_model=UserResponse)
def create_user(
    user: UserCreate,
    db: Session = Depends(deps.get_db),
):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # In a real application, you would hash the password here
    db_user = User(
        email=user.email,
        hashed_password=user.password,  # Don't do this in production!
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/me", response_model=UserProfile)
def read_user_me(
    current_user: User = Depends(deps.get_current_user),
):
    """
    Get current user.
    """
    return current_user

@router.get("/balance")
def get_user_balance(
    current_user: User = Depends(deps.get_current_user),
):
    """
    Get user's current trading balance.
    """
    return {
        "balance": current_user.balance,
        "balance_usd": f"${current_user.balance / 100:.2f}"  # Convert cents to dollars
    }

@router.post("/balance/add")
def add_balance(
    balance_data: dict,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """
    Add fake currency to user's balance (for testing purposes).
    Amount should be in cents.
    """
    amount = balance_data.get("amount", 0)
    if amount <= 0 or amount > 100000:  # Max $1000 at a time
        raise HTTPException(status_code=400, detail="Amount must be between 1 and 100000 cents")
    
    current_user.balance += amount
    db.commit()
    
    return {
        "message": f"Added ${amount / 100:.2f} to balance",
        "new_balance": current_user.balance,
        "new_balance_usd": f"${current_user.balance / 100:.2f}"
    }

@router.put("/profile", response_model=AuthUserResponse)
async def update_profile(
    username: str = Form(...),
    profile_picture: Optional[UploadFile] = File(None),
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """
    Update user profile including username and profile picture.
    """
    # Check if username is already taken by another user
    if username != current_user.username:
        existing_user = db.query(User).filter(
            User.username == username,
            User.user_id != current_user.user_id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Update username
    current_user.username = username
    
    # Handle profile picture upload
    if profile_picture:
        # Store old profile picture path BEFORE updating it
        old_profile_picture = current_user.profile_picture
        logger.info(f"Old profile picture to be deleted: {old_profile_picture}")
        
        # Validate file type
        if not profile_picture.content_type or not profile_picture.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File must be an image"
            )
        
        # Validate file size (10MB limit)
        if profile_picture.size and profile_picture.size > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size must be under 10MB"
            )
        
        # Create uploads directory if it doesn't exist
        upload_dir = Path("uploads/profile_pictures")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate unique filename
        file_extension = profile_picture.filename.split('.')[-1] if profile_picture.filename else 'jpg'
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = upload_dir / filename
        
        # Save new file first
        try:
            with open(file_path, "wb") as buffer:
                content = await profile_picture.read()
                buffer.write(content)
            logger.info(f"Saved new profile picture: {file_path}")
        except Exception as e:
            logger.error(f"Failed to save new profile picture: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save profile picture"
            )
        
        # Update user's profile picture path in database
        current_user.profile_picture = f"/uploads/profile_pictures/{filename}"
        logger.info(f"Updated profile picture in database to: {current_user.profile_picture}")
        
        # Commit the database changes first
        try:
            db.commit()
            db.refresh(current_user)
            logger.info(f"Database updated successfully")
        except Exception as e:
            # If database update fails, clean up the new file
            try:
                file_path.unlink()
                logger.info(f"Cleaned up new file after database failure: {file_path}")
            except:
                pass
            logger.error(f"Failed to update database: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update profile"
            )
        
        # Only delete old file after successful database update
        if old_profile_picture and old_profile_picture.startswith('/uploads/'):
            old_file_path = Path(old_profile_picture.lstrip('/'))
            logger.info(f"Attempting to delete old file: {old_file_path}")
            
            if old_file_path.exists():
                try:
                    old_file_path.unlink()
                    logger.info(f"Successfully deleted old profile picture: {old_file_path}")
                except Exception as e:
                    logger.warning(f"Could not delete old profile picture {old_file_path}: {e}")
            else:
                logger.warning(f"Old profile picture file not found: {old_file_path}")
        else:
            logger.info(f"No old profile picture to delete (was: {old_profile_picture})")
    else:
        # No new profile picture uploaded, just update username
        logger.info("No profile picture uploaded, only updating username")
        db.commit()
        db.refresh(current_user)
    
    return current_user

@router.put("/password")
def update_password(
    password_data: PasswordUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """
    Update user password.
    """
    # Verify current password
    if not security.verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    current_user.hashed_password = security.get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password updated successfully"}

@router.delete("/me")
def delete_account(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """
    Delete current user account and all associated data.
    """
    # Delete profile picture file if it exists
    if current_user.profile_picture and current_user.profile_picture.startswith('/uploads/'):
        file_path = Path(current_user.profile_picture.lstrip('/'))
        if file_path.exists():
            try:
                file_path.unlink()
                logger.info(f"Deleted profile picture on account deletion: {file_path}")
            except Exception as e:
                logger.warning(f"Could not delete profile picture {file_path}: {e}")
    
    # Delete user (cascade will handle related data)
    db.delete(current_user)
    db.commit()
    
    return {"message": "Account deleted successfully"} 

@router.get("/positions")
def get_user_positions(
    market_id: Optional[int] = Query(None, description="Filter positions by market ID"),
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db),
):
    """
    Get user's positions, optionally filtered by market.
    """
    query = db.query(Position).options(
        joinedload(Position.contract).joinedload(Contract.market)
    ).filter(
        Position.user_id == current_user.user_id,
        Position.quantity != 0  # Only show non-zero positions
    )
    
    if market_id:
        query = query.join(Contract).filter(Contract.market_id == market_id)
    
    positions = query.all()
    
    result = []
    for position in positions:
        result.append({
            "contract_id": position.contract_id,
            "contract_title": position.contract.title,
            "contract_side": position.contract_side,
            "quantity": position.quantity,
            "avg_price": str(position.avg_price),
            "market_id": position.contract.market.market_id,
            "market_title": position.contract.market.title,
        })
    
    return result 

@router.get("/search")
def search_users(
    q: str = Query(..., min_length=1, max_length=50),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    limit: int = Query(10, le=20),
):
    """
    Search for users by username with fuzzy matching.
    """
    # Use ILIKE for case-insensitive partial matching
    users = db.query(User).filter(
        User.username.ilike(f"%{q}%")
    ).filter(
        User.is_active == True
    ).limit(limit).all()
    
    # Sort by relevance (exact matches first, then by username length)
    def relevance_score(user):
        username_lower = user.username.lower()
        query_lower = q.lower()
        
        if username_lower == query_lower:
            return 0  # Exact match
        elif username_lower.startswith(query_lower):
            return 1  # Starts with query
        else:
            return 2  # Contains query
    
    users.sort(key=relevance_score)
    
    return [
        {
            "user_id": user.user_id,
            "username": user.username,
            "profile_picture": user.profile_picture,
        }
        for user in users
    ] 