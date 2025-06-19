from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime
from typing import Optional

class PositionBase(BaseModel):
    user_id: int
    contract_id: int
    quantity: int  # positive for YES, negative for NO
    avg_price: Decimal = Field(..., ge=0, le=1, decimal_places=4)
    realised_pnl: Optional[Decimal] = Field(default=0, decimal_places=2)

class PositionCreate(PositionBase):
    pass

class PositionUpdate(BaseModel):
    quantity: Optional[int] = None
    avg_price: Optional[Decimal] = Field(None, ge=0, le=1, decimal_places=4)
    realised_pnl: Optional[Decimal] = Field(None, decimal_places=2)

class PositionResponse(PositionBase):
    position_id: int
    updated_at: datetime

    class Config:
        from_attributes = True 