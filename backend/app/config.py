import os
from pydantic_settings import BaseSettings
from pydantic import ConfigDict

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", extra="ignore")
    
    PROJECT_NAME: str = "Smart Campus Lost & Found System"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "smart_campus_lost_found")
    
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super_secret_jwt_key_smart_campus_lost_found_2026_change_in_production")
    SESSION_SECRET: str = os.getenv("SESSION_SECRET", "super_secret_session_key_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # Email settings
    EMAIL_HOST: str = os.getenv("EMAIL_HOST", "")
    EMAIL_PORT: int = int(os.getenv("EMAIL_PORT", 587))
    EMAIL_USERNAME: str = os.getenv("EMAIL_USERNAME", "")
    EMAIL_PASSWORD: str = os.getenv("EMAIL_PASSWORD", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "noreply@campuslostfound.edu")
    
    # SMS settings
    SMS_PROVIDER: str = os.getenv("SMS_PROVIDER", "")
    SMS_API_KEY: str = os.getenv("SMS_API_KEY", "")
    SMS_API_SECRET: str = os.getenv("SMS_API_SECRET", "")
    SMS_FROM: str = os.getenv("SMS_FROM", "+18005550199")
    
    # Security Policy Limits
    OTP_EXPIRY_MINUTES: int = 5
    OTP_MAX_ATTEMPTS: int = 5
    OTP_RESEND_LIMIT: int = 3
    VERIFICATION_TOKEN_EXPIRY: int = 60

settings = Settings()
