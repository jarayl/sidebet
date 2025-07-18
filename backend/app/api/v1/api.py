from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, markets, ideas, profiles, orders, system, admin

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(markets.router, prefix="/markets", tags=["markets"])
api_router.include_router(orders.router, prefix="/orders", tags=["orders"])
api_router.include_router(ideas.router, prefix="/ideas", tags=["ideas"])
api_router.include_router(profiles.router, prefix="/profiles", tags=["profiles"])
api_router.include_router(system.router, prefix="/system", tags=["system"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"]) 