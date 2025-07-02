from pydantic import BaseModel
from typing import Optional

class ContractBase(BaseModel):
    title: str
    description: Optional[str] = None

class ContractCreate(ContractBase):
    market_id: int

class ContractUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    resolution: Optional[str] = None

class ContractResponse(ContractBase):
    contract_id: int
    market_id: int
    status: str
    resolution: Optional[str] = None

    class Config:
        from_attributes = True 