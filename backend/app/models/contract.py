from sqlalchemy import Column, BigInteger, String, Text, CheckConstraint, UniqueConstraint, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Contract(Base):
    __tablename__ = "contracts"

    contract_id = Column(BigInteger, primary_key=True, index=True)
    market_id = Column(BigInteger, ForeignKey("markets.market_id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)  # e.g., "Person A will be head coach"
    description = Column(Text)  # Detailed description of what this contract represents
    status = Column(String(12), default='open', nullable=False)  # 'open', 'closed', 'resolved'
    resolution = Column(String(3))  # 'YES' or 'NO' when resolved, NULL when unresolved
    
    # Add check constraints
    __table_args__ = (
        CheckConstraint("status IN ('open', 'closed', 'resolved')", name='check_contract_status'),
        CheckConstraint("resolution IN ('YES', 'NO', 'UNDECIDED')", name='check_contract_resolution'),
        # Ensure contract titles are unique within a market
        UniqueConstraint('market_id', 'title', name='unique_market_contract_title'),
    )
    
    # Relationships - using string references to avoid circular imports
    market = relationship("Market", back_populates="contracts")
    orders = relationship("Order", back_populates="contract")
    trades = relationship("Trade", back_populates="contract")
    positions = relationship("Position", back_populates="contract") 