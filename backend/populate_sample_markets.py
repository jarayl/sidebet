#!/usr/bin/env python3

import sys
import os
from datetime import datetime, timedelta

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from sqlalchemy import Column, BigInteger, String, Text, DateTime, CheckConstraint
from app.db.base_class import Base

# Simple Market class without relationships
class Market(Base):
    __tablename__ = "markets"

    market_id = Column(BigInteger, primary_key=True, index=True)
    title = Column(Text, nullable=False)
    description = Column(Text)
    category = Column(String(50))
    image_url = Column(String(500))
    start_time = Column(DateTime(timezone=True), nullable=False)
    close_time = Column(DateTime(timezone=True), nullable=False)
    resolve_time = Column(DateTime(timezone=True))
    status = Column(String(12), default='open', nullable=False)
    result = Column(String(10))

def create_sample_markets():
    db: Session = SessionLocal()
    
    try:
        # Clear existing markets
        db.query(Market).delete()
        
        sample_markets = [
            {
                "title": "Phoenix vs Las Vegas",
                "description": "Pro Women's Basketball championship game prediction",
                "category": "Sports",
                "image_url": "🏀",
                "start_time": datetime.now(),
                "close_time": datetime.now() + timedelta(days=30),
            },
            {
                "title": "Democratic NYC Mayor nominee this year?",
                "description": "Who will be the Democratic nominee for NYC Mayor?",
                "category": "Politics", 
                "image_url": "🗽",
                "start_time": datetime.now(),
                "close_time": datetime.now() + timedelta(days=60),
            },
            {
                "title": "Pro Hockey Champion?",
                "description": "Which team will win the Pro Hockey championship?",
                "category": "Sports",
                "image_url": "🏒",
                "start_time": datetime.now(),
                "close_time": datetime.now() + timedelta(days=45),
            },
            {
                "title": "Gas prices in the US this month?",
                "description": "Will gas prices exceed certain thresholds this month?",
                "category": "Economics",
                "image_url": "⛽",
                "start_time": datetime.now(),
                "close_time": datetime.now() + timedelta(days=30),
            },
            {
                "title": "Chicago WS vs Texas",
                "description": "Pro Baseball World Series matchup prediction",
                "category": "Sports",
                "image_url": "⚾",
                "start_time": datetime.now(),
                "close_time": datetime.now() + timedelta(days=20),
            },
            {
                "title": "Toronto vs Philadelphia",
                "description": "Pro Baseball playoff series prediction",
                "category": "Sports", 
                "image_url": "⚾",
                "start_time": datetime.now(),
                "close_time": datetime.now() + timedelta(days=15),
            },
            {
                "title": "Los Angeles A vs Baltimore",
                "description": "Pro Baseball championship series prediction",
                "category": "Sports",
                "image_url": "⚾",
                "start_time": datetime.now(),
                "close_time": datetime.now() + timedelta(days=25),
            },
            {
                "title": "Colorado vs Atlanta",
                "description": "Pro Baseball playoff matchup prediction",
                "category": "Sports",
                "image_url": "⚾",
                "start_time": datetime.now(),
                "close_time": datetime.now() + timedelta(days=18),
            },
            {
                "title": "Minnesota vs Houston",
                "description": "Pro Baseball series prediction",
                "category": "Sports",
                "image_url": "⚾",
                "start_time": datetime.now(),
                "close_time": datetime.now() + timedelta(days=22),
            },
        ]
        
        for market_data in sample_markets:
            market = Market(**market_data)
            db.add(market)
        
        db.commit()
        print(f"Successfully created {len(sample_markets)} sample markets!")
        
    except Exception as e:
        print(f"Error creating sample markets: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_markets() 