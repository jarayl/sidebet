#!/usr/bin/env python3
"""
Add sample positions (bets) for testing profile functionality
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User
from app.models.market import Market
from app.models.contract import Contract
from app.models.position import Position
from decimal import Decimal

def create_sample_positions():
    db = SessionLocal()
    
    try:
        # Get the first user
        user = db.query(User).first()
        if not user:
            print("No users found. Please create a user first.")
            return
        
        print(f"Creating sample positions for user: {user.username}")
        
        # Get some markets
        markets = db.query(Market).limit(5).all()
        if not markets:
            print("No markets found. Please create markets first.")
            return
        
        # Create contracts for markets if they don't exist
        for market in markets:
            # Check if YES contract exists
            yes_contract = db.query(Contract).filter(
                Contract.market_id == market.market_id,
                Contract.outcome == "YES"
            ).first()
            
            if not yes_contract:
                yes_contract = Contract(
                    market_id=market.market_id,
                    outcome="YES",
                    initial_price=Decimal("0.5")
                )
                db.add(yes_contract)
            
            # Check if NO contract exists
            no_contract = db.query(Contract).filter(
                Contract.market_id == market.market_id,
                Contract.outcome == "NO"
            ).first()
            
            if not no_contract:
                no_contract = Contract(
                    market_id=market.market_id,
                    outcome="NO",
                    initial_price=Decimal("0.5")
                )
                db.add(no_contract)
        
        db.commit()
        
        # Create sample positions
        contracts = db.query(Contract).limit(6).all()
        
        sample_positions = [
            {"contract": contracts[0], "quantity": 100, "avg_price": Decimal("0.65")},
            {"contract": contracts[1], "quantity": 50, "avg_price": Decimal("0.45")},
            {"contract": contracts[2], "quantity": 200, "avg_price": Decimal("0.72")},
            {"contract": contracts[3], "quantity": 75, "avg_price": Decimal("0.38")},
        ]
        
        for pos_data in sample_positions:
            # Check if position already exists
            existing_position = db.query(Position).filter(
                Position.user_id == user.user_id,
                Position.contract_id == pos_data["contract"].contract_id
            ).first()
            
            if not existing_position:
                position = Position(
                    user_id=user.user_id,
                    contract_id=pos_data["contract"].contract_id,
                    quantity=pos_data["quantity"],
                    avg_price=pos_data["avg_price"],
                    realised_pnl=Decimal("0")
                )
                db.add(position)
                print(f"Created position: {pos_data['quantity']} shares of {pos_data['contract'].outcome} in market {pos_data['contract'].market_id}")
            else:
                print(f"Position already exists for contract {pos_data['contract'].contract_id}")
        
        db.commit()
        print("Sample positions created successfully!")
        
    except Exception as e:
        print(f"Error creating sample positions: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_positions() 