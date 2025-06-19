from sqlalchemy import Column, BigInteger, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Trade(Base):
    __tablename__ = "trades"

    trade_id = Column(BigInteger, primary_key=True, index=True)
    buy_order_id = Column(BigInteger, ForeignKey("orders.order_id"), nullable=False)
    sell_order_id = Column(BigInteger, ForeignKey("orders.order_id"), nullable=False)
    contract_id = Column(BigInteger, ForeignKey("contracts.contract_id"), nullable=False)
    price = Column(Numeric(6, 4), nullable=False)
    quantity = Column(Integer, nullable=False)
    executed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships - using string references to avoid circular imports
    buy_order = relationship("Order", foreign_keys=[buy_order_id], back_populates="buy_trades")
    sell_order = relationship("Order", foreign_keys=[sell_order_id], back_populates="sell_trades")
    contract = relationship("Contract", back_populates="trades") 