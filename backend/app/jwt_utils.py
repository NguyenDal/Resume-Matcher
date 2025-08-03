from datetime import datetime, timedelta
from jose import jwt

# Secret key used for signing the JWT. 
# IMPORTANT: Replace this with an environment variable in production for security.
SECRET_KEY = "YOUR_SUPER_SECRET_KEY"

# Algorithm used for encoding the JWT.
ALGORITHM = "HS256"

# Default expiration time for access tokens (1 day).
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

def create_access_token(data: dict, expires_delta: timedelta = None):
    """
    Generates a JSON Web Token (JWT) with the provided data payload.
    
    Args:
        data (dict): The data to include in the token payload.
        expires_delta (timedelta, optional): Custom expiration time for the token.
            If not provided, the default expiration time is used.

    Returns:
        str: The encoded JWT as a string.
    """
    # Copy the input data to avoid modifying the original dictionary.
    to_encode = data.copy()

    # Calculate the expiration time for the token.
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

    # Add the expiration time to the payload.
    to_encode.update({"exp": expire})

    # Encode the payload into a JWT using the secret key and algorithm.
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    # Return the encoded JWT.
    return encoded_jwt
