from sqlalchemy import Column, BigInteger, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class UserFollow(Base):
    __tablename__ = "user_follows"

    follow_id = Column(BigInteger, primary_key=True, index=True)
    follower_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    following_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Ensure a user can't follow the same person twice and can't follow themselves
    __table_args__ = (
        UniqueConstraint('follower_id', 'following_id', name='unique_user_follow'),
    )
    
    # Relationships - using string references to avoid circular imports
    follower = relationship("User", foreign_keys=[follower_id], back_populates="following")
    following = relationship("User", foreign_keys=[following_id], back_populates="followers") 