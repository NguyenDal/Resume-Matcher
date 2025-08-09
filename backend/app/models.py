from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base
from datetime import datetime, timedelta
import secrets

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)

    profile_image_url = Column(String, nullable=True)
    profession = Column(String, nullable=True)
    bio = Column(String, nullable=True)

    reset_token = Column(String, unique=True, nullable=True, index=True)
    reset_token_expiration = Column(DateTime, nullable=True)

    @property
    def full_name(self) -> str:
        parts = [self.first_name or "", self.last_name or ""]
        return " ".join([p for p in parts if p]).strip()

    def generate_reset_token(self, expires_in=3600):
        self.reset_token = secrets.token_urlsafe(32)
        self.reset_token_expiration = datetime.utcnow() + timedelta(seconds=expires_in)

    def verify_reset_token(self, token):
        return (
            self.reset_token == token and
            self.reset_token_expiration is not None and
            datetime.utcnow() < self.reset_token_expiration
        )

    def clear_reset_token(self):
        self.reset_token = None
        self.reset_token_expiration = None