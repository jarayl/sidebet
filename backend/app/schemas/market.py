from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from enum import Enum

class MarketStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
    RESOLVED = "resolved"
    CANCELLED = "cancelled"

class ContractBase(BaseModel):
    title: str
    description: Optional[str] = None

class ContractCreate(ContractBase):
    pass

class ContractUpdate(ContractBase):
    contract_id: Optional[int] = None

class MarketBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    image_url: Optional[str] = None
    start_time: datetime
    close_time: datetime
    resolve_time: Optional[datetime] = None

class MarketCreate(MarketBase):
    contracts: List[ContractCreate]

class MarketUpdate(MarketBase):
    contracts: List[ContractUpdate]

class ContractResponse(BaseModel):
    contract_id: int
    title: str
    description: Optional[str] = None
    status: str
    resolution: Optional[str] = None
    yes_price: Optional[str] = None
    no_price: Optional[str] = None
    yes_volume: Optional[int] = 0
    no_volume: Optional[int] = 0

class MarketResponse(MarketBase):
    market_id: int
    status: str
    result: Optional[str] = None
    is_bookmarked: Optional[bool] = False
    contracts: List[ContractResponse]

    class Config:
        from_attributes = True 