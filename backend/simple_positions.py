#!/usr/bin/env python3
"""
Add sample positions (bets) for testing profile functionality
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings
from decimal import Decimal

def create_sample_positions():
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
    
    with engine.connect() as conn:
        try:
            # Get the first user
            result = conn.execute(text("SELECT user_id, username FROM users LIMIT 1"))
            user = result.fetchone()
            if not user:
                print("No users found. Please create a user first.")
                return
            
            user_id = user[0]
            username = user[1]
            print(f"Creating sample positions for user: {username}")
            
            # Get some markets
            result = conn.execute(text("SELECT market_id, title FROM markets LIMIT 5"))
            markets = result.fetchall()
            if not markets:
                print("No markets found. Please create markets first.")
                return
            
            # Create contracts for markets if they don't exist
            for market in markets:
                market_id = market[0]
                
                # Check if YES contract exists
                result = conn.execute(text(
                    "SELECT contract_id FROM contracts WHERE market_id = :market_id AND outcome = 'YES'"
                ), {"market_id": market_id})
                yes_contract = result.fetchone()
                
                if not yes_contract:
                    conn.execute(text(
                        "INSERT INTO contracts (market_id, outcome, initial_price) VALUES (:market_id, 'YES', 0.5)"
                    ), {"market_id": market_id})
                
                # Check if NO contract exists
                result = conn.execute(text(
                    "SELECT contract_id FROM contracts WHERE market_id = :market_id AND outcome = 'NO'"
                ), {"market_id": market_id})
                no_contract = result.fetchone()
                
                if not no_contract:
                    conn.execute(text(
                        "INSERT INTO contracts (market_id, outcome, initial_price) VALUES (:market_id, 'NO', 0.5)"
                    ), {"market_id": market_id})
            
            conn.commit()
            
            # Get contracts
            result = conn.execute(text("SELECT contract_id FROM contracts LIMIT 6"))
            contracts = result.fetchall()
            
            sample_positions = [
                {"contract_id": contracts[0][0], "quantity": 100, "avg_price": "0.65"},
                {"contract_id": contracts[1][0], "quantity": 50, "avg_price": "0.45"},
                {"contract_id": contracts[2][0], "quantity": 200, "avg_price": "0.72"},
                {"contract_id": contracts[3][0], "quantity": 75, "avg_price": "0.38"},
            ]
            
            for pos_data in sample_positions:
                # Check if position already exists
                result = conn.execute(text(
                    "SELECT position_id FROM positions WHERE user_id = :user_id AND contract_id = :contract_id"
                ), {"user_id": user_id, "contract_id": pos_data["contract_id"]})
                existing_position = result.fetchone()
                
                if not existing_position:
                    conn.execute(text(
                        """INSERT INTO positions (user_id, contract_id, quantity, avg_price, realised_pnl) 
                           VALUES (:user_id, :contract_id, :quantity, :avg_price, 0)"""
                    ), {
                        "user_id": user_id,
                        "contract_id": pos_data["contract_id"],
                        "quantity": pos_data["quantity"],
                        "avg_price": pos_data["avg_price"]
                    })
                    print(f"Created position: {pos_data['quantity']} shares in contract {pos_data['contract_id']}")
                else:
                    print(f"Position already exists for contract {pos_data['contract_id']}")
            
            conn.commit()
            print("Sample positions created successfully!")
            
        except Exception as e:
            print(f"Error creating sample positions: {e}")
            conn.rollback()

if __name__ == "__main__":
    create_sample_positions() 