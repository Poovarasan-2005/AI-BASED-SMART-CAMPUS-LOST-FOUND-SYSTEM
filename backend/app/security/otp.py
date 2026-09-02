import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Tuple, Dict, Any, Optional
from app.config import settings

def generate_secure_otp(length: int = 6) -> str:
    """
    Generates a cryptographically secure 6-digit OTP string using Python secrets module.
    Never uses pseudo-random numbers (Math.random / random.random).
    """
    if length == 6:
        number = secrets.randbelow(900000) + 100000
    else:
        number = secrets.randbelow(90000000) + 10000000
    return str(number)

def hash_otp(otp_str: str) -> str:
    """Hashes the OTP using SHA-256."""
    return hashlib.sha256(otp_str.encode('utf-8')).hexdigest()

def verify_otp_hash(otp_str: str, hashed_otp: str) -> bool:
    """Validates plain OTP string against stored SHA-256 hash using timing-attack safe comparison."""
    if not otp_str or not hashed_otp:
        return False
    return secrets.compare_digest(hash_otp(otp_str.strip()), hashed_otp.strip())

def get_otp_expiration() -> datetime:
    """Returns timestamp for OTP expiration (default 5 minutes)."""
    return datetime.utcnow() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)

def generate_secure_token() -> str:
    """Generates a secure URL-safe random token for email verification."""
    return secrets.token_urlsafe(32)
