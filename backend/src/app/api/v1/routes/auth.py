from fastapi import APIRouter, HTTPException
from src.app.models.schemas import LoginRequest, LoginResponse

router = APIRouter()

# Hardcoded credentials
HARDCODED_EMAIL = "haroonaulakh57@gmail.com"
HARDCODED_PASSWORD = "haroon102103"

@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    """Login endpoint"""
    try:
        if credentials.email == HARDCODED_EMAIL and credentials.password == HARDCODED_PASSWORD:
            return LoginResponse(
                success=True,
                message="Login successful",
                user={"email": credentials.email}
            )
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")
