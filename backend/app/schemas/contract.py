from pydantic import BaseModel, Field
from decimal import Decimal
from typing import Optional

class ContractBase(BaseModel):
    outcome: str
    initial_price: Optional[Decimal] = Field(None, ge=0, le=1, decimal_places=4)

class ContractCreate(ContractBase):
    market_id: int

class ContractUpdate(BaseModel):
    outcome: Optional[str] = None
    initial_price: Optional[Decimal] = Field(None, ge=0, le=1, decimal_places=4)

class ContractResponse(ContractBase):
    contract_id: int
    market_id: int

    class Config:
        from_attributes = True 