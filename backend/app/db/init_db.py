from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.db.create_indexes import create_performance_indexes
from app.models.user import User
from app.core.security import get_password_hash

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
    
    # Create default admin user
    create_admin_user()

def create_admin_user() -> None:
    """Create a default admin user if one doesn't exist."""
    db = SessionLocal()
    try:
        # Check if admin user already exists
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if existing_admin:
            print("✓ Admin user already exists")
            return
        
        # Create admin user
        admin_user = User(
            email="admin@college.harvard.edu",
            username="admin",
            hashed_password=get_password_hash("12345678"),
            is_superuser=True,  # This makes them an admin
            is_active=True,
            is_verified=True,
            status='active',
            balance=100000  # Give them $1000 initial balance
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("✅ Default admin user created successfully!")
        print(f"   Email: {admin_user.email}")
        print(f"   Username: {admin_user.username}")
        print(f"   Password: 12345678")
        print(f"   User ID: {admin_user.user_id}")
        print()
        print("🔐 IMPORTANT: Change the admin password after first login!")
        print("   Login at: http://localhost:3000/login")
        print("   Admin panel: http://localhost:3000/admin")
        
    except Exception as e:
        db.rollback()
        print(f"✗ Error creating admin user: {e}")
    finally:
        db.close() 