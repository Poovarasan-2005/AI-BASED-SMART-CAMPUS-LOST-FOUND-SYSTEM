import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from app.database.db import get_database

async def log_security_event(
    action: str,
    user_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    ip_address: Optional[str] = "127.0.0.1",
    user_agent: Optional[str] = "System",
    success: bool = True,
    metadata: Optional[Dict[str, Any]] = None
):
    """
    Logs security audit events to DB without recording sensitive secrets.
    """
    try:
        db = await get_database()
        
        # Filter sensitive fields from metadata if any
        clean_metadata = {}
        if metadata:
            for k, v in metadata.items():
                if any(secret_word in k.lower() for secret_word in ["password", "otp", "token", "secret", "jwt"]):
                    continue
                clean_metadata[k] = v

        audit_entry = {
            "id": str(uuid.uuid4()),
            "user_id": user_id or "ANONYMOUS",
            "action": action,
            "resource_type": resource_type or "N/A",
            "resource_id": resource_id or "N/A",
            "ip_address": ip_address,
            "user_agent": user_agent,
            "success": success,
            "metadata": clean_metadata,
            "created_at": datetime.utcnow().isoformat()
        }
        
        await db["security_audit_logs"].insert_one(audit_entry)
    except Exception as e:
        print(f"Failed to log security audit event: {e}")
