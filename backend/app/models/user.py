from sqlalchemy import Boolean, Column, BigInteger, String, DateTime, Text, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(BigInteger, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)  # Using CITEXT equivalent
    hashed_password = Column(Text, nullable=False)
    status = Column(String(15), default='active', nullable=False)
    balance = Column(BigInteger, default=0)  # pseudocurrency balance
    profile_picture = Column(String(500), nullable=True)  # URL or path to profile picture
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Legacy fields for compatibility with existing auth system
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, unique=True, nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Add check constraint for status
    __table_args__ = (
        CheckConstraint("status IN ('active', 'suspended', 'closed')", name='check_user_status'),
    )
    
    # Relationships - using string references to avoid circular imports
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    positions = relationship("Position", back_populates="user", cascade="all, delete-orphan")
    ideas = relationship("Idea", back_populates="submitted_by_user")
    idea_likes = relationship("IdeaLike", back_populates="user", cascade="all, delete-orphan")
    idea_comments = relationship("IdeaComment", back_populates="user", cascade="all, delete-orphan")
    idea_bookmarks = relationship("IdeaBookmark", back_populates="user", cascade="all, delete-orphan")
    market_bookmarks = relationship("MarketBookmark", back_populates="user", cascade="all, delete-orphan")
    
    # Follow relationships
    followers = relationship("UserFollow", foreign_keys="UserFollow.following_id", back_populates="following", cascade="all, delete-orphan")
    following = relationship("UserFollow", foreign_keys="UserFollow.follower_id", back_populates="follower", cascade="all, delete-orphan") 