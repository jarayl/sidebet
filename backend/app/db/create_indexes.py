"""
Database indexes for optimal performance based on the schema requirements.
Run this after creating the tables to add performance indexes.
"""
from sqlalchemy import text
from app.db.session import engine

def create_performance_indexes():
    """Create additional indexes for optimal query performance."""
    
    indexes = [
        # Markets table indexes
        "CREATE INDEX IF NOT EXISTS idx_markets_status_close_time ON markets (status, close_time);",
        
        # Orders table indexes for fast matching
        "CREATE INDEX IF NOT EXISTS idx_orders_contract_status ON orders (contract_id, status);",
        "CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders (user_id, status);",
        "CREATE INDEX IF NOT EXISTS idx_orders_open_status ON orders (contract_id) WHERE status = 'open';",  # Partial index for open orders
        
        # Trades table indexes
        "CREATE INDEX IF NOT EXISTS idx_trades_contract_executed_at ON trades (contract_id, executed_at DESC);",
        
        # Positions table indexes
        "CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions (user_id);",
        "CREATE INDEX IF NOT EXISTS idx_positions_contract_id ON positions (contract_id);",
        
        # Contracts table indexes
        "CREATE INDEX IF NOT EXISTS idx_contracts_market_id ON contracts (market_id);",
        "CREATE INDEX IF NOT EXISTS idx_contracts_market_status ON contracts (market_id, status);",
    ]
    
    with engine.connect() as conn:
        for index_sql in indexes:
            try:
                conn.execute(text(index_sql))
                print(f"✓ Created index: {index_sql.split('idx_')[1].split(' ')[0] if 'idx_' in index_sql else 'partial index'}")
            except Exception as e:
                print(f"✗ Failed to create index: {e}")
        conn.commit()

if __name__ == "__main__":
    create_performance_indexes()
    print("Database indexes creation completed.") 