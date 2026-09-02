from fastapi import HTTPException, status, Depends
from typing import List, Dict, Any, Optional
from app.security.auth import get_current_user_token
from app.database.db import get_database

class RoleChecker:
    """Dependency that checks if the authenticated user has one of the allowed roles."""
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    async def __call__(self, token_data: Dict[str, Any] = Depends(get_current_user_token)) -> Dict[str, Any]:
        user_id = token_data.get("sub")
        role = token_data.get("role")
        
        if not user_id or not role:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user token context"
            )
            
        # Verify user account active status from DB
        db = await get_database()
        user = await db["users"].find_one({"uuid": user_id})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authenticated user record not found"
            )
            
        if user.get("account_status") in ["SUSPENDED", "LOCKED"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is suspended or locked"
            )
            
        # Check role permission
        db_role = user.get("role")
        if db_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Role '{db_role}' is not authorized for this operation."
            )
            
        # Attach full user database profile (without password)
        user_profile = dict(user)
        user_profile.pop("password_hash", None)
        return user_profile

async def verify_resource_ownership(user: Dict[str, Any], resource_user_id: str):
    """
    Prevents IDOR/BOLA attacks.
    Ensures that non-admin users can only access their own resources.
    """
    if user.get("role") == "ADMIN":
        return True
    if user.get("uuid") != resource_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You do not own this resource."
        )
    return True
