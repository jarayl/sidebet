from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from app.core.config import settings

# Configure engine with connection pooling for better concurrency
engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    poolclass=QueuePool,
    pool_size=20,  # Number of connections to maintain in the pool
    max_overflow=30,  # Additional connections that can be created on demand
    pool_pre_ping=True,  # Validate connections before use
    pool_recycle=3600,  # Recycle connections after 1 hour
    echo=False,  # Set to True for SQL debugging
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False  # Keep objects accessible after commit
) 