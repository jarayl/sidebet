from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func, and_, or_
from typing import List, Optional

from app.api import deps
from app.models.user import User
from app.models.user_follow import UserFollow
from app.models.idea import Idea
from app.models.idea_like import IdeaLike
from app.models.idea_comment import IdeaComment
from app.models.position import Position
from app.models.market import Market
from app.models.contract import Contract
from app.schemas.profile import (
    UserProfileResponse, UserProfilePublicResponse, FollowResponse,
    UserActivityResponse, UserBetResponse
)

router = APIRouter()

@router.get("/{username}", response_model=UserProfileResponse)
def get_user_profile(
    username: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Get user profile - returns full profile if own profile, public profile otherwise"""
    target_user = db.query(User).filter(User.username == username).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get follower/following counts
    followers_count = db.query(UserFollow).filter(UserFollow.following_id == target_user.user_id).count()
    following_count = db.query(UserFollow).filter(UserFollow.follower_id == target_user.user_id).count()
    
    # Get total likes received on ideas
    likes_count = db.query(func.sum(Idea.likes_count)).filter(Idea.submitted_by == target_user.user_id).scalar() or 0
    
    # Check if current user is following target user
    is_following = False
    if current_user.user_id != target_user.user_id:
        is_following = db.query(UserFollow).filter(
            UserFollow.follower_id == current_user.user_id,
            UserFollow.following_id == target_user.user_id
        ).first() is not None
    
    # Get user's active positions (bets)
    active_positions = db.query(Position).options(
        joinedload(Position.contract).joinedload(Contract.market)
    ).filter(
        Position.user_id == target_user.user_id,
        Position.quantity != 0,
        Position.is_active == True  # Only show active positions
    ).all()
    
    bets = []
    for position in active_positions:
        market = position.contract.market
        bets.append({
            "market_id": market.market_id,
            "contract_title": position.contract.title,
            "market_title": market.title,
            "market_category": market.category,
            "outcome": position.contract_side,
            "quantity": position.quantity if current_user.user_id == target_user.user_id else None,
            "avg_price": position.avg_price if current_user.user_id == target_user.user_id else None,
        })
    
    # Get user's ideas
    ideas = db.query(Idea).options(joinedload(Idea.submitted_by_user)).filter(
        Idea.submitted_by == target_user.user_id
    ).order_by(desc(Idea.created_at)).limit(10).all()
    
    idea_list = []
    for idea in ideas:
        idea_list.append({
            "idea_id": idea.idea_id,
            "title": idea.title,
            "description": idea.description,
            "created_at": idea.created_at,
            "likes_count": idea.likes_count,
            "comments_count": idea.comments_count,
        })
    
    # Get user's comments (replies)
    comments = db.query(IdeaComment).options(
        joinedload(IdeaComment.idea)
    ).filter(
        IdeaComment.user_id == target_user.user_id
    ).order_by(desc(IdeaComment.created_at)).limit(10).all()
    
    replies = []
    for comment in comments:
        replies.append({
            "comment_id": comment.comment_id,
            "content": comment.content,
            "created_at": comment.created_at,
            "idea_title": comment.idea.title,
            "idea_id": comment.idea.idea_id,
        })
    
    is_own_profile = current_user.user_id == target_user.user_id
    
    return {
        "user_id": target_user.user_id,
        "username": target_user.username,
        "email": target_user.email if is_own_profile else None,
        "created_at": target_user.created_at,
        "followers_count": followers_count,
        "following_count": following_count,
        "likes_count": likes_count,
        "is_following": is_following,
        "is_own_profile": is_own_profile,
        "balance": target_user.balance if is_own_profile else None,
        "profile_picture": target_user.profile_picture,
        "bets": bets,
        "ideas": idea_list,
        "replies": replies,
    }

@router.post("/{username}/follow", response_model=FollowResponse)
def toggle_follow(
    username: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Follow or unfollow a user"""
    target_user = db.query(User).filter(User.username == username).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if current_user.user_id == target_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    existing_follow = db.query(UserFollow).filter(
        UserFollow.follower_id == current_user.user_id,
        UserFollow.following_id == target_user.user_id
    ).first()
    
    if existing_follow:
        # Unfollow
        db.delete(existing_follow)
        is_following = False
    else:
        # Follow
        follow = UserFollow(
            follower_id=current_user.user_id,
            following_id=target_user.user_id
        )
        db.add(follow)
        is_following = True
    
    db.commit()
    
    # Get updated follower count
    followers_count = db.query(UserFollow).filter(UserFollow.following_id == target_user.user_id).count()
    
    return {
        "is_following": is_following,
        "followers_count": followers_count
    }

@router.get("/{username}/activity", response_model=List[UserActivityResponse])
def get_user_activity(
    username: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 20,
):
    """Get user's activity history (own profile only)"""
    target_user = db.query(User).filter(User.username == username).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if current_user.user_id != target_user.user_id:
        raise HTTPException(status_code=403, detail="Can only view your own activity")
    
    # This is a simplified activity feed - in a real app you'd have a dedicated activity table
    activities = []
    
    # Get recent ideas
    recent_ideas = db.query(Idea).filter(
        Idea.submitted_by == target_user.user_id
    ).order_by(desc(Idea.created_at)).limit(limit).all()
    
    for idea in recent_ideas:
        activities.append({
            "type": "idea_created",
            "created_at": idea.created_at,
            "description": f"Posted idea: {idea.title}",
            "related_id": idea.idea_id,
        })
    
    # Get recent comments
    recent_comments = db.query(IdeaComment).options(
        joinedload(IdeaComment.idea)
    ).filter(
        IdeaComment.user_id == target_user.user_id
    ).order_by(desc(IdeaComment.created_at)).limit(limit).all()
    
    for comment in recent_comments:
        activities.append({
            "type": "comment_created",
            "created_at": comment.created_at,
            "description": f"Replied to: {comment.idea.title}",
            "related_id": comment.idea.idea_id,
        })

    # Get recent resolved bets
    resolved_positions = db.query(Position).join(Position.contract).join(Contract.market).filter(
        Position.user_id == target_user.user_id,
        Market.status == 'resolved',
        Market.resolve_time is not None
    ).order_by(desc(Market.resolve_time)).limit(limit).all()

    for pos in resolved_positions:
        market = pos.contract.market
        is_win = market.result == pos.contract.outcome
        
        activities.append({
            "type": "bet_resolved",
            "created_at": market.resolve_time,
            "description": f"Bet on '{market.title}' resolved. You {'won' if is_win else 'lost'}.",
            "related_id": market.market_id,
        })
    
    # Sort by date and limit
    activities.sort(key=lambda x: x["created_at"], reverse=True)
    return activities[skip:skip + limit] 