from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from app.database.db import get_database
from app.security.auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

class NotificationResponse(BaseModel):
    uuid: str
    type: str
    title: str
    message: str
    link: Optional[str] = None
    status: str
    created_at: str
    read_at: Optional[str] = None

async def create_system_notification(
    db,
    user_id: str,
    notif_type: str,
    title: str,
    message: str,
    link: Optional[str] = None
) -> Dict[str, Any]:
    """
    Helper utility to generate persistent in-app notifications for:
    - AI_MATCH
    - VERIFICATION_REQUEST
    - NEW_MESSAGE
    - ITEM_RETURNED
    - SECURITY_ALERT
    """
    notif_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    
    doc = {
        "id": notif_id,
        "uuid": notif_id,
        "user_id": user_id,
        "type": notif_type,
        "title": title,
        "message": message,
        "link": link or "",
        "status": "UNREAD",
        "created_at": now_iso,
        "read_at": None
    }
    
    await db["notifications"].insert_one(doc)
    return doc

@router.get("")
async def get_user_notifications(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Fetches notifications for the authenticated user, sorted descending by created_at.
    Returns list of notifications and unread_count.
    """
    db = await get_database()
    user_id = current_user.get("uuid")
    
    cursor = db["notifications"].find({
        "user_id": user_id,
        "status": {"$ne": "ARCHIVED"}
    }).sort("created_at", -1)
    
    notifications = await cursor.to_list(100)
    unread_count = sum(1 for n in notifications if n.get("status") == "UNREAD")
    
    return {
        "notifications": notifications,
        "unread_count": unread_count
    }

@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Marks a specific notification as READ.
    """
    db = await get_database()
    user_id = current_user.get("uuid")
    now_iso = datetime.now(timezone.utc).isoformat()
    
    notif = await db["notifications"].find_one({
        "$or": [{"uuid": notification_id}, {"id": notification_id}],
        "user_id": user_id
    })
    
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
        
    await db["notifications"].update_one(
        {"_id": notif["_id"]},
        {"$set": {"status": "READ", "read_at": now_iso}}
    )
    
    return {"message": "Notification marked as read.", "uuid": notification_id}

@router.put("/read-all")
async def mark_all_notifications_read(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Marks all unread notifications for the user as READ.
    """
    db = await get_database()
    user_id = current_user.get("uuid")
    now_iso = datetime.now(timezone.utc).isoformat()
    
    # In MongoDB / MemoryDatabase update all
    cursor = db["notifications"].find({"user_id": user_id, "status": "UNREAD"})
    unreads = await cursor.to_list(200)
    
    for u in unreads:
        await db["notifications"].update_one(
            {"_id": u["_id"]},
            {"$set": {"status": "READ", "read_at": now_iso}}
        )
        
    return {"message": f"Marked {len(unreads)} notifications as read."}

@router.delete("/{notification_id}")
async def archive_notification(
    notification_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Archives a notification from user's active list.
    """
    db = await get_database()
    user_id = current_user.get("uuid")
    
    notif = await db["notifications"].find_one({
        "$or": [{"uuid": notification_id}, {"id": notification_id}],
        "user_id": user_id
    })
    
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
        
    await db["notifications"].update_one(
        {"_id": notif["_id"]},
        {"$set": {"status": "ARCHIVED"}}
    )
    
    return {"message": "Notification archived."}
