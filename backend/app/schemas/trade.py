from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime

class TradeBase(BaseModel):
    buy_order_id: int
    sell_order_id: int
    contract_id: int
    price: Decimal = Field(..., ge=0, le=1, decimal_places=4)
    quantity: int = Field(..., gt=0)

class TradeCreate(TradeBase):
    pass

class TradeResponse(TradeBase):
    trade_id: int
    executed_at: datetime

    class Config:
        from_attributes = True 