from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func
from typing import List, Optional

from app.api import deps
from app.models.idea import Idea
from app.models.idea_like import IdeaLike
from app.models.idea_comment import IdeaComment
from app.models.idea_bookmark import IdeaBookmark
from app.models.user import User
from app.schemas.idea import (
    IdeaResponse, IdeaCreate, IdeaUpdate, IdeaDetailResponse,
    IdeaCommentCreate, IdeaCommentResponse, IdeaLikeResponse, IdeaBookmarkResponse
)

router = APIRouter()

@router.get("/", response_model=List[IdeaResponse])
def get_ideas(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 20,
    filter_type: str = Query("home", regex="^(home|trending|bookmarked|replies)$"),
):
    """Get ideas with different filters"""
    query = db.query(Idea).options(joinedload(Idea.submitted_by_user))
    
    if filter_type == "trending":
        # Sort by likes count and recent activity
        query = query.order_by(desc(Idea.likes_count), desc(Idea.created_at))
    elif filter_type == "bookmarked":
        # Only show bookmarked ideas for current user
        query = query.join(IdeaBookmark).filter(IdeaBookmark.user_id == current_user.user_id)
    elif filter_type == "replies":
        # Show ideas where user has commented
        query = query.join(IdeaComment).filter(IdeaComment.user_id == current_user.user_id)
    else:  # home
        query = query.order_by(desc(Idea.created_at))
    
    ideas = query.offset(skip).limit(limit).all()
    
    # Add user-specific data (is_liked, is_bookmarked)
    result = []
    for idea in ideas:
        idea_dict = {
            "idea_id": idea.idea_id,
            "title": idea.title,
            "description": idea.description,
            "submitted_by": idea.submitted_by,
            "created_at": idea.created_at,
            "updated_at": idea.updated_at,
            "status": idea.status,
            "linked_market_id": idea.linked_market_id,
            "likes_count": idea.likes_count,
            "comments_count": idea.comments_count,
            "submitted_by_user": {
                "user_id": idea.submitted_by_user.user_id,
                "username": idea.submitted_by_user.username
            } if idea.submitted_by_user else None,
            "is_liked": db.query(IdeaLike).filter(
                IdeaLike.user_id == current_user.user_id,
                IdeaLike.idea_id == idea.idea_id
            ).first() is not None,
            "is_bookmarked": db.query(IdeaBookmark).filter(
                IdeaBookmark.user_id == current_user.user_id,
                IdeaBookmark.idea_id == idea.idea_id
            ).first() is not None,
        }
        result.append(idea_dict)
    
    return result

@router.post("/", response_model=IdeaResponse)
def create_idea(
    idea_in: IdeaCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Create a new idea"""
    idea = Idea(
        title=idea_in.title,
        description=idea_in.description,
        submitted_by=current_user.user_id,
    )
    db.add(idea)
    db.commit()
    db.refresh(idea)
    
    # Load the user relationship
    idea = db.query(Idea).options(joinedload(Idea.submitted_by_user)).filter(Idea.idea_id == idea.idea_id).first()
    
    return {
        "idea_id": idea.idea_id,
        "title": idea.title,
        "description": idea.description,
        "submitted_by": idea.submitted_by,
        "created_at": idea.created_at,
        "updated_at": idea.updated_at,
        "status": idea.status,
        "linked_market_id": idea.linked_market_id,
        "likes_count": idea.likes_count,
        "comments_count": idea.comments_count,
        "submitted_by_user": {
            "user_id": idea.submitted_by_user.user_id,
            "username": idea.submitted_by_user.username
        } if idea.submitted_by_user else None,
        "is_liked": False,
        "is_bookmarked": False,
    }

@router.get("/{idea_id}", response_model=IdeaDetailResponse)
def get_idea(
    idea_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Get a specific idea with comments"""
    idea = db.query(Idea).options(
        joinedload(Idea.submitted_by_user),
        joinedload(Idea.comments).joinedload(IdeaComment.user)
    ).filter(Idea.idea_id == idea_id).first()
    
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    # Format comments
    comments = []
    for comment in idea.comments:
        comments.append({
            "comment_id": comment.comment_id,
            "content": comment.content,
            "created_at": comment.created_at,
            "user": {
                "user_id": comment.user.user_id,
                "username": comment.user.username
            }
        })
    
    return {
        "idea_id": idea.idea_id,
        "title": idea.title,
        "description": idea.description,
        "submitted_by": idea.submitted_by,
        "created_at": idea.created_at,
        "updated_at": idea.updated_at,
        "status": idea.status,
        "linked_market_id": idea.linked_market_id,
        "likes_count": idea.likes_count,
        "comments_count": idea.comments_count,
        "submitted_by_user": {
            "user_id": idea.submitted_by_user.user_id,
            "username": idea.submitted_by_user.username
        } if idea.submitted_by_user else None,
        "is_liked": db.query(IdeaLike).filter(
            IdeaLike.user_id == current_user.user_id,
            IdeaLike.idea_id == idea.idea_id
        ).first() is not None,
        "is_bookmarked": db.query(IdeaBookmark).filter(
            IdeaBookmark.user_id == current_user.user_id,
            IdeaBookmark.idea_id == idea.idea_id
        ).first() is not None,
        "comments": comments
    }

@router.post("/{idea_id}/like", response_model=IdeaLikeResponse)
def toggle_like(
    idea_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Toggle like on an idea"""
    idea = db.query(Idea).filter(Idea.idea_id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    existing_like = db.query(IdeaLike).filter(
        IdeaLike.user_id == current_user.user_id,
        IdeaLike.idea_id == idea_id
    ).first()
    
    if existing_like:
        # Unlike
        db.delete(existing_like)
        idea.likes_count = max(0, idea.likes_count - 1)
        is_liked = False
    else:
        # Like
        like = IdeaLike(user_id=current_user.user_id, idea_id=idea_id)
        db.add(like)
        idea.likes_count += 1
        is_liked = True
    
    db.commit()
    
    return {
        "is_liked": is_liked,
        "likes_count": idea.likes_count
    }

@router.post("/{idea_id}/bookmark", response_model=IdeaBookmarkResponse)
def toggle_bookmark(
    idea_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Toggle bookmark on an idea"""
    idea = db.query(Idea).filter(Idea.idea_id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    existing_bookmark = db.query(IdeaBookmark).filter(
        IdeaBookmark.user_id == current_user.user_id,
        IdeaBookmark.idea_id == idea_id
    ).first()
    
    if existing_bookmark:
        # Remove bookmark
        db.delete(existing_bookmark)
        is_bookmarked = False
    else:
        # Add bookmark
        bookmark = IdeaBookmark(user_id=current_user.user_id, idea_id=idea_id)
        db.add(bookmark)
        is_bookmarked = True
    
    db.commit()
    
    return {
        "is_bookmarked": is_bookmarked
    }

@router.post("/{idea_id}/comments", response_model=IdeaCommentResponse)
def create_comment(
    idea_id: int,
    comment_in: IdeaCommentCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """Create a comment on an idea"""
    idea = db.query(Idea).filter(Idea.idea_id == idea_id).first()
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    comment = IdeaComment(
        user_id=current_user.user_id,
        idea_id=idea_id,
        content=comment_in.content
    )
    db.add(comment)
    
    # Update comments count
    idea.comments_count += 1
    
    db.commit()
    db.refresh(comment)
    
    # Load user relationship
    comment = db.query(IdeaComment).options(joinedload(IdeaComment.user)).filter(
        IdeaComment.comment_id == comment.comment_id
    ).first()
    
    return {
        "comment_id": comment.comment_id,
        "content": comment.content,
        "created_at": comment.created_at,
        "user": {
            "user_id": comment.user.user_id,
            "username": comment.user.username
        }
    } 