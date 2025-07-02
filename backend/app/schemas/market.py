from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from enum import Enum

class MarketStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
    RESOLVED = "resolved"
    CANCELLED = "cancelled"

class ContractOption(BaseModel):
    title: str
    description: Optional[str] = None

class ContractResponse(BaseModel):
    contract_id: int
    title: str
    description: Optional[str] = None
    status: str
    resolution: Optional[str] = None
    # Market data for each side
    yes_price: Optional[str] = None
    no_price: Optional[str] = None
    yes_volume: Optional[int] = None
    no_volume: Optional[int] = None

class MarketBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    start_time: datetime
    close_time: datetime
    resolve_time: Optional[datetime] = None

class MarketCreate(MarketBase):
    contracts: List[ContractOption] = []

class MarketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    start_time: Optional[datetime] = None
    close_time: Optional[datetime] = None
    resolve_time: Optional[datetime] = None
    status: Optional[MarketStatus] = None

class MarketResponse(MarketBase):
    market_id: int
    status: MarketStatus
    is_bookmarked: Optional[bool] = False
    contracts: Optional[List[ContractResponse]] = None

    class Config:
        from_attributes = True 