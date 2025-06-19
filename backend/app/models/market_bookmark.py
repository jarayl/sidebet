from sqlalchemy import Column, BigInteger, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class MarketBookmark(Base):
    __tablename__ = "market_bookmarks"

    bookmark_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    market_id = Column(BigInteger, ForeignKey("markets.market_id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Ensure a user can only bookmark a market once
    __table_args__ = (
        UniqueConstraint('user_id', 'market_id', name='unique_user_market_bookmark'),
    )
    
    # Relationships
    user = relationship("User", back_populates="market_bookmarks")
    market = relationship("Market", back_populates="bookmarks") 