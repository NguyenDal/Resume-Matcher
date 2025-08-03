import bcrypt
from jose import jwt
from datetime import datetime, timedelta
import os

# --- Password hashing and verification ---

def hash_password(password: str) -> str:
    """Hashes a plain text password using bcrypt.
    Returns the hashed password as a string."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    """
    Verifies a plain text password against a hashed password.
    Returns True if the password matches, False otherwise.
    """
    return bcrypt.checkpw(password.encode(), hashed.encode())

# --- JWT encoding/decoding (optional, for advanced use) ---

def create_access_token(data: dict, expires_delta: int = 60*24):
    """
    Creates a JWT access token with the given data payload.
    The token expires after 'expires_delta' minutes (default: 24 hours).
    Uses a secret key from environment variable or fallback.
    """
    SECRET_KEY = os.getenv("SECRET_KEY", "your-fallback-secret")
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_delta)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")