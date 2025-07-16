from sqlalchemy import Column, BigInteger, String, Integer, Numeric, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Order(Base):
    __tablename__ = "orders"

    order_id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    contract_id = Column(BigInteger, ForeignKey("contracts.contract_id"), nullable=False)
    side = Column(String(4), nullable=False)  # 'BUY' or 'SELL'
    contract_side = Column(String(3), nullable=False)  # 'YES' or 'NO' - which side of the contract
    order_type = Column(String(6), nullable=False)  # 'market' or 'limit'
    price = Column(Numeric(6, 4))  # 0–1 inclusive
    quantity = Column(Integer, nullable=False)
    filled_quantity = Column(Integer, default=0)
    status = Column(String(18), default='open', nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Add check constraints
    __table_args__ = (
        CheckConstraint("side IN ('BUY', 'SELL')", name='check_order_side'),
        CheckConstraint("contract_side IN ('YES', 'NO')", name='check_contract_side'),
        CheckConstraint("order_type IN ('market', 'limit')", name='check_order_type'),
        CheckConstraint("price BETWEEN 0 AND 1", name='check_order_price_range'),
        CheckConstraint("quantity > 0", name='check_order_quantity_positive'),
        CheckConstraint("status IN ('open', 'partially_filled', 'filled', 'cancelled', 'market_closed')", name='check_order_status'),
    )
    
    # Relationships - using string references to avoid circular imports
    user = relationship("User", back_populates="orders")
    contract = relationship("Contract", back_populates="orders")
    buy_trades = relationship("Trade", foreign_keys="Trade.buy_order_id", back_populates="buy_order", cascade="all, delete-orphan")
    sell_trades = relationship("Trade", foreign_keys="Trade.sell_order_id", back_populates="sell_order", cascade="all, delete-orphan") 