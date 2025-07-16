from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, text
from sqlalchemy.exc import IntegrityError
from typing import List, Optional, Dict, Any
from decimal import Decimal
import logging
from contextlib import contextmanager
import time
import random

from app.models.order import Order
from app.models.trade import Trade
from app.models.position import Position
from app.models.contract import Contract
from app.models.user import User
from app.core.trading_metrics import get_metrics_collector
from app.models.market import Market

logger = logging.getLogger(__name__)

class TradingEngine:
    """
    Order matching engine for binary prediction markets with robust concurrency controls.
    Each contract has YES and NO sides that users can trade.
    
    Concurrency Strategy:
    1. Use SELECT FOR UPDATE to lock critical rows during order matching
    2. Implement optimistic locking with retry logic for high-contention operations
    3. Use serializable isolation for critical trading operations
    4. Implement deadlock detection and retry with exponential backoff
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.max_retries = 3
        self.base_retry_delay = 0.1  # 100ms base delay
        self.metrics = get_metrics_collector()
    
    @contextmanager
    def serializable_transaction(self):
        """
        Context manager for transactions with automatic retry on conflicts.
        Uses row-level locking instead of changing isolation levels.
        """
        for attempt in range(self.max_retries):
            try:
                yield
                self.db.commit()
                return
            except Exception as e:
                self.db.rollback()
                
                # Check if this is a serialization failure or deadlock
                error_msg = str(e).lower()
                if any(keyword in error_msg for keyword in ['serialization', 'deadlock', 'could not serialize', 'lock']):
                    if 'serialization' in error_msg:
                        self.metrics.record_serialization_conflict()
                    if 'deadlock' in error_msg:
                        self.metrics.record_deadlock_recovery()
                    
                    if attempt < self.max_retries - 1:
                        # Exponential backoff with jitter
                        delay = self.base_retry_delay * (2 ** attempt) + random.uniform(0, 0.05)
                        time.sleep(delay)
                        logger.warning(f"Transaction conflict detected, retrying in {delay:.3f}s (attempt {attempt + 1}/{self.max_retries})")
                        continue
                    else:
                        logger.error(f"Transaction failed after {self.max_retries} attempts: {e}")
                        raise ValueError("High contention detected. Please try again.")
                else:
                    # Non-serialization error, don't retry
                    raise
    
    def place_order(self, user_id: int, contract_id: int, side: str, contract_side: str,
                   order_type: str, price: Optional[Decimal], quantity: int) -> Order:
        """
        Place a new order for a specific side (YES/NO) of a contract with concurrency protection.
        """
        # Start metrics tracking
        order_key = self.metrics.start_order_tracking(
            user_id=user_id,
            contract_id=contract_id,
            side=side,
            contract_side=contract_side,
            quantity=quantity,
            price=float(price) if price else None
        )
        
        retries = 0
        trades_executed = 0
        order = None
        error = None
        
        try:
            # Validate inputs first (before acquiring locks)
            if side not in ["BUY", "SELL"]:
                raise ValueError("Side must be 'BUY' or 'SELL'")
            
            if contract_side not in ["YES", "NO"]:
                raise ValueError("Contract side must be 'YES' or 'NO'")
            
            # Validate price range (1 cent to 99 cents)
            if price is not None:
                if price < Decimal("0.01") or price > Decimal("0.99"):
                    raise ValueError("Price must be between $0.01 and $0.99")
            
            # Use serializable transaction for the entire order placement process
            with self.serializable_transaction():
                # Lock contract to prevent status changes during order placement
                contract = self.db.query(Contract).filter(
                    Contract.contract_id == contract_id
                ).with_for_update().first()
                
                if not contract:
                    raise ValueError("Contract not found")
                
                if contract.status != "open":
                    raise ValueError("Contract is not open for trading")
                
                # Lock user account to prevent balance race conditions
                user = self.db.query(User).filter(
                    User.user_id == user_id
                ).with_for_update().first()
                
                if not user:
                    raise ValueError("User not found")
                
                # Calculate required balance for buy orders
                if side == "BUY":
                    required_balance = int(quantity * price * 100)  # Convert to cents
                    if user.balance < required_balance:
                        raise ValueError("Insufficient balance")
                    
                    # Reserve balance immediately to prevent double-spending
                    user.balance -= required_balance
                
                # For sell orders, validate and lock user position
                if side == "SELL":
                    user_position = self.db.query(Position).filter(
                        and_(
                            Position.user_id == user_id,
                            Position.contract_id == contract_id,
                            Position.contract_side == contract_side
                        )
                    ).with_for_update().first()
                    
                    if not user_position or user_position.quantity < quantity:
                        available_quantity = user_position.quantity if user_position else 0
                        raise ValueError(f"Insufficient {contract_side} position. You have {available_quantity} shares, trying to sell {quantity}")
                
                # Create the order
                order = Order(
                    user_id=user_id,
                    contract_id=contract_id,
                    side=side,
                    contract_side=contract_side,
                    order_type=order_type,
                    price=price,
                    quantity=quantity,
                    filled_quantity=0,
                    status="open"
                )
                
                self.db.add(order)
                self.db.flush()  # Get order ID
                
                # Attempt to match the order (within the same transaction)
                trades_executed = self._match_order_concurrent(order, user)
            
            # Refresh order to get final state
            self.db.refresh(order)
            
            # Complete metrics tracking
            self.metrics.complete_order_tracking(
                order_key=order_key,
                order_id=order.order_id,
                success=True,
                retries=retries,
                trades_executed=trades_executed
            )
            
            return order
            
        except Exception as e:
            error = str(e)
            logger.error(f"Order placement failed: {error}")
            
            # Complete metrics tracking with error
            self.metrics.complete_order_tracking(
                order_key=order_key,
                order_id=order.order_id if order else None,
                success=False,
                error=error,
                retries=retries,
                trades_executed=trades_executed
            )
            
            raise
    
    def _match_order_concurrent(self, new_order: Order, user: User) -> int:
        """
        Attempt to match a new order with existing orders using proper locking.
        This method runs within a serializable transaction.
        Returns the number of trades executed.
        """
        remaining_quantity = new_order.quantity - new_order.filled_quantity
        trades_executed = 0
        
        if remaining_quantity <= 0:
            return trades_executed
        
        # Lock all potentially matching orders to prevent concurrent modifications
        if new_order.side == "BUY":
            # Match with sell orders at or below our price for the same contract side
            matching_orders = self.db.query(Order).filter(
                and_(
                    Order.contract_id == new_order.contract_id,
                    Order.contract_side == new_order.contract_side,
                    Order.side == "SELL",
                    Order.status == "open",
                    Order.price <= new_order.price,
                    Order.user_id != new_order.user_id  # Can't trade with yourself
                )
            ).with_for_update().order_by(Order.price.asc(), Order.created_at.asc()).all()
        else:  # SELL
            # Match with buy orders at or above our price for the same contract side
            matching_orders = self.db.query(Order).filter(
                and_(
                    Order.contract_id == new_order.contract_id,
                    Order.contract_side == new_order.contract_side,
                    Order.side == "BUY", 
                    Order.status == "open",
                    Order.price >= new_order.price,
                    Order.user_id != new_order.user_id
                )
            ).with_for_update().order_by(Order.price.desc(), Order.created_at.asc()).all()
        
        # Lock all counterparty users to prevent balance race conditions
        counterparty_user_ids = [order.user_id for order in matching_orders]
        if counterparty_user_ids:
            counterparty_users = self.db.query(User).filter(
                User.user_id.in_(counterparty_user_ids)
            ).with_for_update().all()
            
            # Create a lookup dict for quick access
            counterparty_users_dict = {u.user_id: u for u in counterparty_users}
        else:
            counterparty_users_dict = {}
        
        for matching_order in matching_orders:
            if remaining_quantity <= 0:
                break
            
            # Skip if order was filled by another concurrent transaction
            if matching_order.filled_quantity >= matching_order.quantity:
                continue
            
            # Calculate trade quantity and price
            available_quantity = matching_order.quantity - matching_order.filled_quantity
            trade_quantity = min(remaining_quantity, available_quantity)
            
            if trade_quantity <= 0:
                continue
            
            # Trade happens at the existing order's price (price-time priority)
            trade_price = matching_order.price
            
            # Get counterparty user
            counterparty_user = counterparty_users_dict.get(matching_order.user_id)
            if not counterparty_user:
                logger.error(f"Counterparty user {matching_order.user_id} not found")
                continue
            
            # Execute the trade
            self._execute_trade_concurrent(new_order, matching_order, trade_price, trade_quantity, user, counterparty_user)
            
            remaining_quantity -= trade_quantity
            trades_executed += 1
        
        # Update order status
        if new_order.filled_quantity == new_order.quantity:
            new_order.status = "filled"
            # Refund any unused balance for buy orders
            if new_order.side == "BUY":
                unused_balance = int((new_order.quantity - new_order.filled_quantity) * new_order.price * 100)
                user.balance += unused_balance
        elif new_order.filled_quantity > 0:
            new_order.status = "partially_filled"
            # Refund partial unused balance for buy orders
            if new_order.side == "BUY":
                unused_balance = int((new_order.quantity - new_order.filled_quantity) * new_order.price * 100)
                user.balance += unused_balance
        else:
            # Order not filled at all, refund full balance for buy orders
            if new_order.side == "BUY":
                unused_balance = int(new_order.quantity * new_order.price * 100)
                user.balance += unused_balance
        
        return trades_executed
    
    def _execute_trade_concurrent(self, order1: Order, order2: Order, 
                                price: Decimal, quantity: int, user1: User, user2: User) -> None:
        """
        Execute a trade between two orders with proper concurrency controls.
        Both users are already locked via with_for_update().
        """
        # Determine which order is buy and which is sell
        if order1.side == "BUY":
            buy_order = order1
            sell_order = order2
            buyer = user1
            seller = user2
        else:
            buy_order = order2
            sell_order = order1
            buyer = user2
            seller = user1
        
        # Create trade record
        trade = Trade(
            buy_order_id=buy_order.order_id,
            sell_order_id=sell_order.order_id,
            contract_id=order1.contract_id,
            price=price,
            quantity=quantity
        )
        self.db.add(trade)
        
        # Update order filled quantities
        order1.filled_quantity += quantity
        order2.filled_quantity += quantity
        
        # Update order statuses
        for order in [order1, order2]:
            if order.filled_quantity == order.quantity:
                order.status = "filled"
            else:
                order.status = "partially_filled"
        
        # Update user balances (buyer already had balance reserved for buy orders)
        trade_value = int(quantity * price * 100)  # Convert to cents
        
        # For buy orders, balance was already reserved, so we don't deduct again
        # Just credit the seller
        seller.balance += trade_value
        
        # Update positions with proper locking
        self._update_position_concurrent(buy_order.user_id, buy_order.contract_id, buy_order.contract_side, quantity, price)
        self._update_position_concurrent(sell_order.user_id, sell_order.contract_id, sell_order.contract_side, -quantity, price)
        
        logger.info(f"Trade executed: {quantity} {buy_order.contract_side} shares at ${price} between users {buyer.user_id} and {seller.user_id}")
    
    def _update_position_concurrent(self, user_id: int, contract_id: int, contract_side: str, quantity_change: int, price: Decimal) -> None:
        """
        Update user's position for a specific side of a contract with proper locking.
        This method assumes it's called within a transaction where the user is already locked.
        """
        # Lock the position to prevent concurrent updates
        position = self.db.query(Position).filter(
            and_(
                Position.user_id == user_id,
                Position.contract_id == contract_id,
                Position.contract_side == contract_side
            )
        ).with_for_update().first()
        
        if not position:
            # Create new position (only for positive quantity changes)
            if quantity_change > 0:
                position = Position(
                    user_id=user_id,
                    contract_id=contract_id,
                    contract_side=contract_side,
                    quantity=quantity_change,
                    avg_price=price,
                    realised_pnl=Decimal("0")
                )
                self.db.add(position)
        else:
            # Update existing position
            if quantity_change > 0:
                # Adding to position - calculate new average price
                old_value = position.quantity * position.avg_price
                new_value = quantity_change * price
                new_quantity = position.quantity + quantity_change
                
                position.avg_price = (old_value + new_value) / new_quantity
                position.quantity = new_quantity
            else:
                # Reducing position
                quantity_to_sell = abs(quantity_change)
                if quantity_to_sell >= position.quantity:
                    # Selling entire position
                    realized_pnl = position.quantity * (price - position.avg_price)
                    position.realised_pnl += realized_pnl
                    position.quantity = 0
                else:
                    # Partial sale
                    realized_pnl = quantity_to_sell * (price - position.avg_price)
                    position.realised_pnl += realized_pnl
                    position.quantity -= quantity_to_sell
    
    def process_market_resolution(self, market: Market):
        """Processes payouts for all contracts in a resolved market."""
        if market.status != "resolved" or not market.result:
            raise ValueError("Market is not resolved or has no result.")

        contracts = self.db.query(Contract).filter(Contract.market_id == market.market_id).all()

        with self.serializable_transaction():
            for contract in contracts:
                self._payout_contract(contract, market.result)

    def _payout_contract(self, contract: Contract, market_result: str):
        """Handles payouts for a single contract based on market result."""
        # Lock all positions for this contract to prevent race conditions.
        positions = self.db.query(Position).filter(
            Position.contract_id == contract.contract_id,
            Position.quantity > 0 # Only process positions with shares
        ).with_for_update().all()

        user_ids = [p.user_id for p in positions]
        if not user_ids:
            return

        # Lock all users involved to update balances safely.
        users = self.db.query(User).filter(User.user_id.in_(user_ids)).with_for_update().all()
        users_dict = {u.user_id: u for u in users}

        for position in positions:
            user = users_dict.get(position.user_id)
            if not user:
                logger.error(f"Payout error: User {position.user_id} not found for position {position.position_id}")
                continue

            payout_amount = 0
            pnl = 0

            if market_result == "UNDECIDED":
                # Refund the initial cost of the position
                payout_amount = int(position.quantity * position.avg_price * 100)
                pnl = 0 # No profit or loss
            elif position.contract_side == market_result: # This is a winning position
                payout_amount = position.quantity * 100 # Each share is worth $1 (100 cents)
                pnl = payout_amount - int(position.quantity * position.avg_price * 100)
            else: # Losing position
                payout_amount = 0
                pnl = -int(position.quantity * position.avg_price * 100)

            # Update user balance and position PnL
            user.balance += payout_amount
            position.realised_pnl += Decimal(pnl) / 100
            position.is_active = False # Mark position as inactive

            logger.info(
                f"Payout for User ID {user.user_id}: Contract {contract.contract_id}, "
                f"Side {position.contract_side}, Qty {position.quantity}, "
                f"Result {market_result}. Payout: {payout_amount/100:.2f}, PnL: {position.realised_pnl:.2f}"
            )

    def get_best_ask_price(self, contract_id: int, contract_side: str) -> Optional[Decimal]:
        """
        Get the best ask price (lowest active sell order) for a specific side of a contract.
        This is used for the YES/NO button displays in the contract list.
        
        Returns the lowest selling price for the specified contract side (YES or NO).
        If no active sell orders exist for this side, returns None.
        """
        order_book = self.get_order_book(contract_id, contract_side)
        
        # Return the lowest ask (sell order) price if available
        if order_book["asks"]:
            return Decimal(order_book["asks"][0]["price"])
        
        return None
    
    def get_market_price(self, contract_id: int) -> Optional[Decimal]:
        """
        Calculate market price as midpoint between highest YES buy order and lowest YES sell order.
        This is used for graphs and market cards (probability display).
        
        Only calculated on the YES side of the contract.
        Requires both a buy order and a sell order to exist.
        
        Returns the midpoint price or None if either buy or sell orders don't exist.
        """
        yes_order_book = self.get_order_book(contract_id, "YES")
        
        # Need both bids (buy orders) and asks (sell orders) for YES side
        if not yes_order_book["bids"] or not yes_order_book["asks"]:
            return None
        
        highest_yes_bid = Decimal(yes_order_book["bids"][0]["price"])
        lowest_yes_ask = Decimal(yes_order_book["asks"][0]["price"])
        
        # Return midpoint
        return (highest_yes_bid + lowest_yes_ask) / 2
    
    def get_last_trade_price(self, contract_id: int) -> Optional[Decimal]:
        """
        Get the price of the most recent trade for this contract (any side).
        """
        last_trade = self.db.query(Trade).filter(
            Trade.contract_id == contract_id
        ).order_by(Trade.executed_at.desc()).first()
        
        return last_trade.price if last_trade else None
    
    def get_contract_stats(self, contract_id: int, contract_side: str) -> Dict[str, Any]:
        """
        Get comprehensive statistics for a specific side of a contract.
        """
        order_book = self.get_order_book(contract_id, contract_side)
        
        # Get best ask price for this specific contract side (for YES/NO buttons)
        best_ask_price = self.get_best_ask_price(contract_id, contract_side)
        
        # Get market price (only calculated once for the contract, based on YES side)
        market_price = self.get_market_price(contract_id)
        
        # Get last trade price for this specific contract side
        last_trade = self.db.query(Trade).join(Order, Trade.buy_order_id == Order.order_id).filter(
            and_(
                Trade.contract_id == contract_id,
                Order.contract_side == contract_side
            )
        ).order_by(Trade.executed_at.desc()).first()
        
        last_trade_price = last_trade.price if last_trade else None
        
        # Calculate total volume from trades for this contract side
        trades = self.db.query(Trade).join(Order, Trade.buy_order_id == Order.order_id).filter(
            and_(
                Trade.contract_id == contract_id,
                Order.contract_side == contract_side
            )
        ).all()
        
        total_volume = len(trades)
        total_value = sum(float(trade.price) * trade.quantity for trade in trades)
        
        return {
            "best_ask_price": float(best_ask_price) if best_ask_price else None,  # For YES/NO buttons
            "market_price": float(market_price) if market_price else None,  # For graphs/cards
            "last_trade_price": float(last_trade_price) if last_trade_price else None,
            "highest_bid": float(order_book["bids"][0]["price"]) if order_book["bids"] else None,
            "lowest_ask": float(order_book["asks"][0]["price"]) if order_book["asks"] else None,
            "total_volume": total_volume,
            "total_value": total_value,
            "bid_depth": len(order_book["bids"]),
            "ask_depth": len(order_book["asks"]),
            "order_book": order_book
        }
    
    def cancel_order(self, order_id: int, user_id: int) -> bool:
        """
        Cancel an open order with proper concurrency controls.
        """
        try:
            with self.serializable_transaction():
                # Lock the order to prevent concurrent modifications
                order = self.db.query(Order).filter(
                    and_(
                        Order.order_id == order_id,
                        Order.user_id == user_id,
                        Order.status.in_(["open", "partially_filled"])
                    )
                ).with_for_update().first()
                
                if not order:
                    return False
                
                # If it's a buy order, refund the remaining balance
                if order.side == "BUY":
                    remaining_quantity = order.quantity - order.filled_quantity
                    if remaining_quantity > 0:
                        refund_amount = int(remaining_quantity * order.price * 100)
                        
                        # Lock user to update balance
                        user = self.db.query(User).filter(
                            User.user_id == user_id
                        ).with_for_update().first()
                        
                        if user:
                            user.balance += refund_amount
                
                order.status = "cancelled"
                
            return True
        except Exception as e:
            logger.error(f"Failed to cancel order {order_id}: {e}")
            return False
    
    def get_order_book(self, contract_id: int, contract_side: str) -> dict:
        """
        Get the current order book for a specific side of a contract.
        """
        # Get buy orders (bids) - highest price first
        buy_orders = self.db.query(Order).filter(
            and_(
                Order.contract_id == contract_id,
                Order.contract_side == contract_side,
                Order.side == "BUY",
                Order.status == "open"
            )
        ).order_by(Order.price.desc()).all()
        
        # Get sell orders (asks) - lowest price first  
        sell_orders = self.db.query(Order).filter(
            and_(
                Order.contract_id == contract_id,
                Order.contract_side == contract_side,
                Order.side == "SELL", 
                Order.status == "open"
            )
        ).order_by(Order.price.asc()).all()
        
        # Aggregate by price level
        bids = {}
        asks = {}
        
        for order in buy_orders:
            price = str(order.price)
            remaining_qty = order.quantity - order.filled_quantity
            if remaining_qty > 0:  # Only include orders with remaining quantity
                if price not in bids:
                    bids[price] = 0
                bids[price] += remaining_qty
        
        for order in sell_orders:
            price = str(order.price)
            remaining_qty = order.quantity - order.filled_quantity
            if remaining_qty > 0:  # Only include orders with remaining quantity
                if price not in asks:
                    asks[price] = 0
                asks[price] += remaining_qty
        
        return {
            "bids": [{"price": price, "quantity": qty} for price, qty in sorted(bids.items(), key=lambda x: float(x[0]), reverse=True)],
            "asks": [{"price": price, "quantity": qty} for price, qty in sorted(asks.items(), key=lambda x: float(x[0]))]
        }
    
    def get_market_prices_for_market(self, market_id: int) -> Dict[int, Optional[Decimal]]:
        """
        Get current market prices for all contracts in a market.
        Returns a dictionary mapping contract_id to market_price.
        Used for market cards to display probabilities.
        """
        contracts = self.db.query(Contract).filter(Contract.market_id == market_id).all()
        
        market_prices = {}
        for contract in contracts:
            market_prices[contract.contract_id] = self.get_market_price(contract.contract_id)
        
        return market_prices 