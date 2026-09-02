import time
from typing import Dict, List
from fastapi import HTTPException, status, Request

class RateLimiter:
    """
    In-memory rate limiter tracking client requests per window.
    """
    def __init__(self, requests_limit: int = 5, window_seconds: int = 60):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.client_records: Dict[str, List[float]] = {}

    def check(self, identifier: str):
        now = time.time()
        timestamps = self.client_records.get(identifier, [])
        
        # Remove timestamps older than window
        valid_timestamps = [t for t in timestamps if now - t < self.window_seconds]
        
        if len(valid_timestamps) >= self.requests_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {self.requests_limit} requests per {self.window_seconds} seconds."
            )
            
        valid_timestamps.append(now)
        self.client_records[identifier] = valid_timestamps

# Preconfigured limiters
auth_limiter = RateLimiter(requests_limit=10, window_seconds=60)
otp_gen_limiter = RateLimiter(requests_limit=3, window_seconds=900) # 3 per 15 min
otp_verify_limiter = RateLimiter(requests_limit=5, window_seconds=300) # 5 per 5 min
