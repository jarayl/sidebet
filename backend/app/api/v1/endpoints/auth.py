from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.api import deps
from app.core import security
from app.core.email import send_verification_email
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token, VerificationResponse
import secrets

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(deps.get_db)):
    # Check if user exists
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create verification token
    verification_token = secrets.token_urlsafe(32)
    
    # Create user
    user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=security.get_password_hash(user_in.password),
        verification_token=verification_token
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Send verification email (disabled for development)
    # send_verification_email(user.email, verification_token)
    
    # Auto-verify for development
    user.is_verified = True
    user.verification_token = None
    db.commit()
    
    return user

@router.post("/login")
def login(
    user_in: UserLogin,
    response: Response,
    db: Session = Depends(deps.get_db)
):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not security.verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    # Email verification disabled for development
    # if not user.is_verified:
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Please verify your email first"
    #     )
    
    try:
        access_token = security.create_access_token(subject=user.email)
        
        # Set HTTP-only cookie
        response.set_cookie(
            key="token",
            value=access_token,
            httponly=True,
            secure=False,  # Set to False for development (HTTP)
            samesite="lax",  # Protect against CSRF
            max_age=7 * 24 * 60 * 60,  # 7 days
            path="/"  # Cookie is available for all paths
        )
        
        return {"message": "Successfully logged in"}
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(
        key="token",
        httponly=True,
        secure=False,  # Set to False for development (HTTP)
        samesite="lax",
        path="/"
    )
    return {"message": "Successfully logged out"}

@router.get("/verify-email/{token}", response_model=VerificationResponse)
def verify_email(token: str, db: Session = Depends(deps.get_db)):
    user = db.query(User).filter(User.verification_token == token).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token"
        )
    
    user.is_verified = True
    user.verification_token = None
    db.commit()
    
    return {"message": "Email verified successfully"} 