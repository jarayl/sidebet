from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from enum import Enum

class MarketStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
    RESOLVED = "resolved"
    CANCELLED = "cancelled"

class MarketResult(str, Enum):
    YES = "YES"
    NO = "NO"
    UNDECIDED = "UNDECIDED"

class MarketBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    start_time: datetime
    close_time: datetime
    resolve_time: Optional[datetime] = None

class MarketCreate(MarketBase):
    pass

class MarketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    start_time: Optional[datetime] = None
    close_time: Optional[datetime] = None
    resolve_time: Optional[datetime] = None
    status: Optional[MarketStatus] = None
    result: Optional[MarketResult] = None

class MarketResponse(MarketBase):
    market_id: int
    status: MarketStatus
    result: Optional[MarketResult] = None
    is_bookmarked: Optional[bool] = False

    class Config:
        from_attributes = True 