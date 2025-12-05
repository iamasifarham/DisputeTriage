from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import random
import string

from backend.services.users_db import (
    get_user_by_username,
    verify_password,
    save_otp,
    verify_otp
)

from backend.services.notify import send_otp_email
from backend.auth.jwt_handler import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


# -----------------------------
# REQUEST MODELS
# -----------------------------
class LoginRequest(BaseModel):
    username: str
    password: str
    role: str

class OTPVerifyRequest(BaseModel):
    username: str
    otp: str
    role: str

# -----------------------------
# LOGIN STEP 1: PASSWORD CHECK
# -----------------------------
@router.post("/login")
def login_step_one(data: LoginRequest):
    user = get_user_by_username(data.username)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Role must match
    if user["role"] != data.role:
        raise HTTPException(status_code=403, detail="Role mismatch")

    
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid password")

    # Generate OTP
    otp = "".join(random.choices(string.digits, k=6))
    save_otp(data.username, otp)

    # Send email
    send_otp_email(
        to_email=user["email"],
        otp=otp,
        username=user["username"]
    )

    return {
        "message": "OTP sent to registered email",
        "username": data.username
    }


# -----------------------------
# LOGIN STEP 2: OTP VERIFY
# -----------------------------
@router.post("/verify-otp")
def login_step_two(data: OTPVerifyRequest):
    ok, result = verify_otp(data.username, data.otp)

    if not ok:
        raise HTTPException(status_code=401, detail=result)

    user = result
    
    # Role must match
    if user["role"] != data.role:
        raise HTTPException(status_code=403, detail="Role mismatch")

    # Issue JWT token
    token = create_access_token(user["id"], user["role"])

    return {
        "access_token": token,
        "role": user["role"],
        "username": user["username"]
    }
