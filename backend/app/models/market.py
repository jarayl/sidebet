from sqlalchemy import Column, BigInteger, String, Text, DateTime, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Market(Base):
    __tablename__ = "markets"

    market_id = Column(BigInteger, primary_key=True, index=True)
    title = Column(Text, nullable=False)
    description = Column(Text)
    category = Column(String(50))
    image_url = Column(String(500))  # URL or path to market image
    start_time = Column(DateTime(timezone=True), nullable=False)  # trading opens
    close_time = Column(DateTime(timezone=True), nullable=False)  # last moment to trade
    resolve_time = Column(DateTime(timezone=True))
    status = Column(String(12), default='open', nullable=False)
    result = Column(String(10))
    
    # Add check constraints
    __table_args__ = (
        CheckConstraint("status IN ('open', 'closed', 'resolved', 'cancelled')", name='check_market_status'),
        CheckConstraint("result IN ('YES', 'NO', 'UNDECIDED')", name='check_market_result'),
    )
    
    # Relationships - using string references to avoid circular imports
    contracts = relationship("Contract", back_populates="market", cascade="all, delete-orphan")
    ideas = relationship("Idea", back_populates="linked_market")
    bookmarks = relationship("MarketBookmark", back_populates="market", cascade="all, delete-orphan") 