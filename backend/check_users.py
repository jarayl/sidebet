#!/usr/bin/env python3
from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
with engine.connect() as conn:
    result = conn.execute(text('SELECT user_id, username, email, created_at FROM users'))
    users = result.fetchall()
    print('Users in database:')
    for user in users:
        print(f'  ID: {user[0]}, Username: {user[1]}, Email: {user[2]}, Created: {user[3]}')
    
    # Check if user_follows table exists (PostgreSQL)
    result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_name='user_follows'"))
    table_exists = result.fetchone()
    print(f'\nuser_follows table exists: {table_exists is not None}')
    
    if table_exists:
        result = conn.execute(text('SELECT COUNT(*) FROM user_follows'))
        count = result.fetchone()[0]
        print(f'Number of follow relationships: {count}') 