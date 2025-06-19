from app.db.base import Base
from app.db.session import engine
from app.db.create_indexes import create_performance_indexes

def init_db() -> None:
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create performance indexes
    try:
        create_performance_indexes()
        print("✓ Database tables and indexes created successfully")
    except Exception as e:
        print(f"✗ Error creating indexes: {e}")
        print("Tables created, but some indexes may be missing") 