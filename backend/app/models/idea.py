from sqlalchemy import Column, BigInteger, String, Text, DateTime, ForeignKey, CheckConstraint, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Idea(Base):
    __tablename__ = "ideas"

    idea_id = Column(BigInteger, primary_key=True, index=True)
    submitted_by = Column(BigInteger, ForeignKey("users.user_id", ondelete="SET NULL"))
    title = Column(Text, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    status = Column(String(12), default='pending', nullable=False)
    linked_market_id = Column(BigInteger, ForeignKey("markets.market_id"))
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    
    # Add check constraint for status
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'accepted', 'rejected')", name='check_idea_status'),
    )
    
    # Relationships
    submitted_by_user = relationship("User", back_populates="ideas")
    linked_market = relationship("Market", back_populates="ideas")
    likes = relationship("IdeaLike", back_populates="idea", cascade="all, delete-orphan")
    comments = relationship("IdeaComment", back_populates="idea", cascade="all, delete-orphan")
    bookmarks = relationship("IdeaBookmark", back_populates="idea", cascade="all, delete-orphan") 