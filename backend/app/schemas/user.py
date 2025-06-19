from pydantic import BaseModel, EmailStr, constr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    username: str

class UserResponse(UserBase):
    user_id: int
    username: str
    is_active: bool
    is_superuser: bool
    status: str
    balance: int
    profile_picture: Optional[str] = None

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    username: constr(min_length=3, max_length=12, pattern=r'^[a-zA-Z0-9_]+$')

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: constr(min_length=8) 