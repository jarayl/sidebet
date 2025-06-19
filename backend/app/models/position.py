from sqlalchemy import Column, BigInteger, Integer, Numeric, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Position(Base):
    __tablename__ = "positions"

    position_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id"), nullable=False, index=True)
    contract_id = Column(BigInteger, ForeignKey("contracts.contract_id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)  # positive for YES, negative for NO
    avg_price = Column(Numeric(6, 4), nullable=False)
    realised_pnl = Column(Numeric(14, 2), default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Add unique constraint for user-contract combination
    __table_args__ = (
        UniqueConstraint('user_id', 'contract_id', name='unique_user_contract_position'),
    )
    
    # Relationships - using string references to avoid circular imports
    user = relationship("User", back_populates="positions")
    contract = relationship("Contract", back_populates="positions") 