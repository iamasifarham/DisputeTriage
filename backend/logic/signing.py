import jwt
from datetime import datetime, timedelta

SIGNED_URL_SECRET = "SIGNED_URL_SECRET_123"  # use environment variable in production

def generate_signed_url(file_name: str, minutes_valid=5):
    payload = {
        "file": file_name,
        "exp": datetime.utcnow() + timedelta(minutes=minutes_valid)
    }
    token = jwt.encode(payload, SIGNED_URL_SECRET, algorithm="HS256")
    return token

def verify_signed_url(token: str):
    return jwt.decode(token, SIGNED_URL_SECRET, algorithms=["HS256"])
