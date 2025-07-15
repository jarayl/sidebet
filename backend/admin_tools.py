#!/usr/bin/env python3
"""
Admin management tools for SideBet platform.
"""

import sys
import argparse
from sqlalchemy import text
from app.db.session import engine
from app.core.security import get_password_hash

def list_users(admins_only=False):
    """List all users or just admins"""
    with engine.connect() as conn:
        if admins_only:
            query = "SELECT user_id, username, email, is_superuser, is_active, status, balance FROM users WHERE is_superuser = true ORDER BY user_id;"
            title = "Admin Users"
        else:
            query = "SELECT user_id, username, email, is_superuser, is_active, status, balance FROM users ORDER BY user_id;"
            title = "All Users"
        
        result = conn.execute(text(query))
        users = result.fetchall()
        
        print(f"\n=== {title} ===")
        if not users:
            print("No users found.")
            return
        
        print(f"{'ID':<5} {'Username':<15} {'Email':<30} {'Admin':<6} {'Active':<6} {'Status':<10} {'Balance':<10}")
        print("-" * 85)
        
        for user in users:
            admin_status = "Yes" if user[3] else "No"
            active_status = "Yes" if user[4] else "No"
            balance = f"${user[6]/100:.2f}" if user[6] else "$0.00"
            print(f"{user[0]:<5} {user[1]:<15} {user[2]:<30} {admin_status:<6} {active_status:<6} {user[5]:<10} {balance:<10}")

def create_admin(email, username, password="12345678"):
    """Create a new admin user"""
    if not email.endswith("@college.harvard.edu"):
        print("Error: Email must end with @college.harvard.edu")
        return False
    
    hashed_password = get_password_hash(password)
    
    with engine.connect() as conn:
        # Check if user exists
        result = conn.execute(text("SELECT COUNT(*) FROM users WHERE username = :username OR email = :email;"), 
                            {"username": username, "email": email})
        count = result.scalar()
        
        if count > 0:
            print(f"Error: User with username '{username}' or email '{email}' already exists")
            return False
        
        # Create admin user
        conn.execute(text("""
            INSERT INTO users (username, email, hashed_password, is_superuser, is_active, is_verified, status, balance, created_at)
            VALUES (:username, :email, :password, true, true, true, 'active', 100000, NOW());
        """), {"username": username, "email": email, "password": hashed_password})
        
        conn.commit()
        
        print(f"✅ Admin user created: {username} ({email})")
        print(f"   Password: {password}")
        return True

def promote_user(identifier):
    """Promote a user to admin by email or username"""
    with engine.connect() as conn:
        # Find user
        result = conn.execute(text("""
            SELECT user_id, username, email, is_superuser 
            FROM users 
            WHERE username = :identifier OR email = :identifier;
        """), {"identifier": identifier})
        
        user = result.fetchone()
        if not user:
            print(f"Error: User not found - {identifier}")
            return False
        
        if user[3]:  # is_superuser
            print(f"User {user[1]} is already an admin")
            return True
        
        # Promote to admin
        conn.execute(text("UPDATE users SET is_superuser = true WHERE user_id = :user_id;"), 
                    {"user_id": user[0]})
        conn.commit()
        
        print(f"✅ User promoted to admin: {user[1]} ({user[2]})")
        return True

def demote_user(identifier):
    """Demote an admin user to regular user by email or username"""
    with engine.connect() as conn:
        # Find user
        result = conn.execute(text("""
            SELECT user_id, username, email, is_superuser 
            FROM users 
            WHERE username = :identifier OR email = :identifier;
        """), {"identifier": identifier})
        
        user = result.fetchone()
        if not user:
            print(f"Error: User not found - {identifier}")
            return False
        
        if not user[3]:  # is_superuser
            print(f"User {user[1]} is not an admin")
            return True
        
        # Check if this is the last admin
        result = conn.execute(text("SELECT COUNT(*) FROM users WHERE is_superuser = true;"))
        admin_count = result.scalar()
        
        if admin_count <= 1:
            print("Error: Cannot demote the last admin user")
            return False
        
        # Demote user
        conn.execute(text("UPDATE users SET is_superuser = false WHERE user_id = :user_id;"), 
                    {"user_id": user[0]})
        conn.commit()
        
        print(f"✅ Admin demoted to user: {user[1]} ({user[2]})")
        return True

def reset_password(identifier, new_password="12345678"):
    """Reset password for a user"""
    hashed_password = get_password_hash(new_password)
    
    with engine.connect() as conn:
        # Find user
        result = conn.execute(text("""
            SELECT user_id, username, email 
            FROM users 
            WHERE username = :identifier OR email = :identifier;
        """), {"identifier": identifier})
        
        user = result.fetchone()
        if not user:
            print(f"Error: User not found - {identifier}")
            return False
        
        # Update password
        conn.execute(text("UPDATE users SET hashed_password = :password WHERE user_id = :user_id;"), 
                    {"password": hashed_password, "user_id": user[0]})
        conn.commit()
        
        print(f"✅ Password reset for user: {user[1]}")
        print(f"   New password: {new_password}")
        return True

def main():
    parser = argparse.ArgumentParser(description="SideBet Admin Management Tools")
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # List users command
    list_parser = subparsers.add_parser('list', help='List users')
    list_parser.add_argument('--admins', action='store_true', help='Show only admin users')
    
    # Create admin command
    create_parser = subparsers.add_parser('create', help='Create a new admin user')
    create_parser.add_argument('email', help='Admin email (@college.harvard.edu)')
    create_parser.add_argument('username', help='Admin username')
    create_parser.add_argument('--password', default='12345678', help='Admin password (default: 12345678)')
    
    # Promote user command
    promote_parser = subparsers.add_parser('promote', help='Promote user to admin')
    promote_parser.add_argument('user', help='Username or email to promote')
    
    # Demote user command
    demote_parser = subparsers.add_parser('demote', help='Demote admin to user')
    demote_parser.add_argument('user', help='Username or email to demote')
    
    # Reset password command
    reset_parser = subparsers.add_parser('reset-password', help='Reset user password')
    reset_parser.add_argument('user', help='Username or email')
    reset_parser.add_argument('--password', default='12345678', help='New password (default: 12345678)')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        print("\nCurrent admin users:")
        list_users(admins_only=True)
        return
    
    # Execute commands
    if args.command == 'list':
        list_users(args.admins)
    elif args.command == 'create':
        create_admin(args.email, args.username, args.password)
    elif args.command == 'promote':
        promote_user(args.user)
    elif args.command == 'demote':
        demote_user(args.user)
    elif args.command == 'reset-password':
        reset_password(args.user, args.password)

if __name__ == "__main__":
    main() 