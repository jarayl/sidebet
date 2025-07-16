from sqlalchemy import Column, BigInteger, Integer, String, Numeric, DateTime, ForeignKey, UniqueConstraint, CheckConstraint, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Position(Base):
    __tablename__ = "positions"

    position_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    contract_id = Column(BigInteger, ForeignKey("contracts.contract_id"), nullable=False, index=True)
    contract_side = Column(String(3), nullable=False)  # 'YES' or 'NO'
    quantity = Column(Integer, nullable=False)  # number of shares owned
    avg_price = Column(Numeric(6, 4), nullable=False)  # average price paid
    realised_pnl = Column(Numeric(14, 2), default=0)
    is_active = Column(Boolean, default=True, nullable=False)  # False when market is resolved/closed
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Add constraints
    __table_args__ = (
        CheckConstraint("contract_side IN ('YES', 'NO')", name='check_position_contract_side'),
        CheckConstraint("quantity >= 0", name='check_position_quantity_positive'),
        # Ensure a user can only have one position per contract-side combination
        UniqueConstraint('user_id', 'contract_id', 'contract_side', name='unique_user_contract_side_position'),
    )
    
    # Relationships - using string references to avoid circular imports
    user = relationship("User", back_populates="positions")
    contract = relationship("Contract", back_populates="positions") 