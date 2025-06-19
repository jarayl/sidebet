from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from decimal import Decimal

class UserBetResponse(BaseModel):
    market_id: int
    market_title: str
    market_category: Optional[str] = None
    outcome: str
    quantity: Optional[int] = None  # Hidden for other users
    avg_price: Optional[Decimal] = None  # Hidden for other users

class UserIdeaResponse(BaseModel):
    idea_id: int
    title: str
    description: Optional[str] = None
    created_at: datetime
    likes_count: int
    comments_count: int

class UserReplyResponse(BaseModel):
    comment_id: int
    content: str
    created_at: datetime
    idea_title: str
    idea_id: int

class UserProfileResponse(BaseModel):
    user_id: int
    username: str
    email: Optional[str] = None  # Only shown for own profile
    created_at: datetime
    followers_count: int
    following_count: int
    likes_count: int
    is_following: bool
    is_own_profile: bool
    balance: Optional[int] = None  # Only shown for own profile
    profile_picture: Optional[str] = None
    bets: List[UserBetResponse]
    ideas: List[UserIdeaResponse]
    replies: List[UserReplyResponse]

class UserProfilePublicResponse(BaseModel):
    user_id: int
    username: str
    created_at: datetime
    followers_count: int
    following_count: int
    likes_count: int
    is_following: bool
    bets: List[UserBetResponse]
    ideas: List[UserIdeaResponse]
    replies: List[UserReplyResponse]

class FollowResponse(BaseModel):
    is_following: bool
    followers_count: int

class UserActivityResponse(BaseModel):
    type: str  # "idea_created", "comment_created", "bet_placed", etc.
    created_at: datetime
    description: str
    related_id: Optional[int] = None 