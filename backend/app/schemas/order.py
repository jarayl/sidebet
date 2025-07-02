from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime
from typing import Optional
from enum import Enum

class OrderSide(str, Enum):
    BUY = "BUY"
    SELL = "SELL"

class ContractSide(str, Enum):
    YES = "YES"
    NO = "NO"

class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"

class OrderStatus(str, Enum):
    OPEN = "open"
    PARTIALLY_FILLED = "partially_filled"
    FILLED = "filled"
    CANCELLED = "cancelled"
    MARKET_CLOSED = "market_closed"

class OrderBase(BaseModel):
    contract_id: int
    side: OrderSide
    contract_side: ContractSide  # YES or NO side of the contract
    order_type: OrderType
    price: Optional[Decimal] = Field(None, ge=0, le=1, decimal_places=4)
    quantity: int = Field(..., gt=0)

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    price: Optional[Decimal] = Field(None, ge=0, le=1, decimal_places=4)
    quantity: Optional[int] = Field(None, gt=0)
    status: Optional[OrderStatus] = None

class OrderResponse(OrderBase):
    order_id: int
    user_id: int
    filled_quantity: int
    status: OrderStatus
    created_at: datetime

    class Config:
        from_attributes = True 