from sqlalchemy import Column, BigInteger, String, Numeric, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Contract(Base):
    __tablename__ = "contracts"

    contract_id = Column(BigInteger, primary_key=True, index=True)
    market_id = Column(BigInteger, ForeignKey("markets.market_id", ondelete="CASCADE"), nullable=False, index=True)
    outcome = Column(String(20), nullable=False)  # e.g., 'YES'
    initial_price = Column(Numeric(6, 4))  # 0–1 inclusive
    
    # Add check constraint for price range
    __table_args__ = (
        CheckConstraint("initial_price BETWEEN 0 AND 1", name='check_initial_price_range'),
        UniqueConstraint('market_id', 'outcome', name='unique_market_outcome'),
    )
    
    # Relationships - using string references to avoid circular imports
    market = relationship("Market", back_populates="contracts")
    orders = relationship("Order", back_populates="contract")
    trades = relationship("Trade", back_populates="contract")
    positions = relationship("Position", back_populates="contract") 