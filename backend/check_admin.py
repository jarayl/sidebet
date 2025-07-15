#!/usr/bin/env python3
"""
Simple script to check and create admin users.
"""

import sys
from sqlalchemy import text
from app.db.session import engine
from app.core.security import get_password_hash

def check_admin_users():
    """Check what admin users exist using raw SQL"""
    with engine.connect() as conn:
        result = conn.execute(text("SELECT user_id, username, email, is_superuser FROM users WHERE is_superuser = true;"))
        admins = result.fetchall()
        
        print("=== Current Admin Users ===")
        if admins:
            for admin in admins:
                print(f"ID: {admin[0]} | Username: {admin[1]} | Email: {admin[2]} | Admin: {admin[3]}")
        else:
            print("No admin users found.")
            
    return len(admins) > 0

def create_admin_user():
    """Create admin user using raw SQL"""
    hashed_password = get_password_hash("12345678")
    
    with engine.connect() as conn:
        # Check if admin user exists
        result = conn.execute(text("SELECT COUNT(*) FROM users WHERE username = 'admin';"))
        count = result.scalar()
        
        if count > 0:
            print("✓ Admin user already exists")
            return
        
        # Create admin user
        conn.execute(text("""
            INSERT INTO users (username, email, hashed_password, is_superuser, is_active, is_verified, status, balance, created_at)
            VALUES ('admin', 'admin@college.harvard.edu', :password, true, true, true, 'active', 100000, NOW());
        """), {"password": hashed_password})
        
        conn.commit()
        
        print("✅ Admin user created successfully!")
        print("   Email: admin@college.harvard.edu")
        print("   Username: admin")
        print("   Password: 12345678")
        print()
        print("🔐 IMPORTANT: Change the admin password after first login!")
        print("   Login at: http://localhost:3000/login")
        print("   Admin panel: http://localhost:3000/admin")

def main():
    """Main function"""
    if len(sys.argv) > 1 and sys.argv[1] == "create":
        create_admin_user()
    else:
        has_admins = check_admin_users()
        if not has_admins:
            print("\nNo admin users found. Run 'python check_admin.py create' to create one.")

if __name__ == "__main__":
    main() 