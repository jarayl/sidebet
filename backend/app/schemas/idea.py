from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from enum import Enum

class IdeaStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class IdeaBase(BaseModel):
    title: str
    description: Optional[str] = None

class IdeaCreate(IdeaBase):
    pass

class IdeaUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[IdeaStatus] = None
    linked_market_id: Optional[int] = None

class UserInfo(BaseModel):
    user_id: int
    username: str
    profile_picture: Optional[str] = None

    class Config:
        from_attributes = True

class IdeaCommentResponse(BaseModel):
    comment_id: int
    content: str
    created_at: datetime
    user: UserInfo

    class Config:
        from_attributes = True

class IdeaResponse(IdeaBase):
    idea_id: int
    submitted_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    status: IdeaStatus
    linked_market_id: Optional[int] = None
    likes_count: int
    comments_count: int
    submitted_by_user: Optional[UserInfo] = None
    is_liked: Optional[bool] = False
    is_bookmarked: Optional[bool] = False

    class Config:
        from_attributes = True

class IdeaDetailResponse(IdeaResponse):
    comments: List[IdeaCommentResponse] = []

class IdeaCommentCreate(BaseModel):
    content: str

class IdeaLikeResponse(BaseModel):
    is_liked: bool
    likes_count: int

class IdeaBookmarkResponse(BaseModel):
    is_bookmarked: bool 