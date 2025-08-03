import bcrypt
from jose import jwt
from datetime import datetime, timedelta
import os

# --- Password hashing and verification ---

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

# --- JWT encoding/decoding (optional, for advanced use) ---

def create_access_token(data: dict, expires_delta: int = 60*24):
    SECRET_KEY = os.getenv("SECRET_KEY", "your-fallback-secret")
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_delta)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
