from sqlalchemy import Column, BigInteger, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class IdeaBookmark(Base):
    __tablename__ = "idea_bookmarks"

    bookmark_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    idea_id = Column(BigInteger, ForeignKey("ideas.idea_id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Ensure a user can only bookmark an idea once
    __table_args__ = (
        UniqueConstraint('user_id', 'idea_id', name='unique_user_idea_bookmark'),
    )
    
    # Relationships
    user = relationship("User", back_populates="idea_bookmarks")
    idea = relationship("Idea", back_populates="bookmarks") 