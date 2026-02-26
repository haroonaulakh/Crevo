from fastapi import APIRouter
from src.app.api.v1.routes import auth, students, withdrawn

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(students.router, prefix="/students", tags=["Students"])
api_router.include_router(withdrawn.router, prefix="/withdrawn", tags=["Withdrawn Students"])
