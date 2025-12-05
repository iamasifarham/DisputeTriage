import jwt
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from backend.settings import JWT_SECRET, JWT_ALGORITHM, JWT_EXP_MINUTES
from backend.services.users_db import get_user_by_id

security = HTTPBearer()


def create_access_token(user_id, role):
    expiry = datetime.utcnow() + timedelta(minutes=JWT_EXP_MINUTES)

    payload = {
        "user_id": user_id,
        "role": role,
        "exp": expiry
    }

    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token


def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_access_token(token)

    user = get_user_by_id(payload["user_id"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return {
    "id": user["id"],
    "username": user["username"],
    "full_name": user["full_name"],
    "email": user["email"],
    "role": user["role"]
    }



def admin_required(current_user=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access only")
    return current_user


def employee_required(current_user=Depends(get_current_user)):
    if current_user["role"] != "employee":
        raise HTTPException(status_code=403, detail="Employee access only")
    return current_user
