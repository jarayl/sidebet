from sqlalchemy import Column, BigInteger, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class IdeaLike(Base):
    __tablename__ = "idea_likes"

    like_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    idea_id = Column(BigInteger, ForeignKey("ideas.idea_id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Ensure a user can only like an idea once
    __table_args__ = (
        UniqueConstraint('user_id', 'idea_id', name='unique_user_idea_like'),
    )
    
    # Relationships
    user = relationship("User", back_populates="idea_likes")
    idea = relationship("Idea", back_populates="likes") 