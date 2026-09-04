from fastapi import APIRouter, HTTPException, Depends, status, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import uuid
from datetime import datetime, timezone
from app.database.db import get_database
from app.security.rbac import RoleChecker, verify_resource_ownership
from app.security.auth import get_current_user
from app.security.audit import log_security_event
from app.services.matching.multimodal_matcher import MultimodalMatcher
from app.routes.notification_routes import create_system_notification

router = APIRouter(prefix="/api/found/reports", tags=["Found Reports"])

class FoundReportCreateRequest(BaseModel):
    item_name: str
    category: str
    description: str
    brand: Optional[str] = ""
    model: Optional[str] = ""
    color: str
    unique_features: Optional[str] = ""
    serial_number: Optional[str] = ""
    found_date: str
    found_time: str
    found_location: str
    image_url: Optional[str] = ""
    additional_info: Optional[str] = ""

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_found_report(
    req: FoundReportCreateRequest,
    request: Request,
    user: Dict[str, Any] = Depends(RoleChecker(["FOUND_USER", "ADMIN"]))
):
    """
    Creates a new Found Item Report with all Section 7 fields.
    Automatically initiates AI matching against active lost items and notifies lost item owners.
    """
    db = await get_database()
    report_id = str(uuid.uuid4())
    user_id = user["uuid"]
    now_iso = datetime.now(timezone.utc).isoformat()

    ai_features = {"dominant_color": req.color, "color_vector": [0.2, 0.4, 0.6, 0.1]}
    
    report_doc = {
        "id": report_id,
        "uuid": report_id,
        "user_id": user_id,
        "item_name": req.item_name,
        "category": req.category,
        "description": req.description,
        "brand": req.brand or "",
        "model": req.model or "",
        "color": req.color,
        "unique_features": req.unique_features or "",
        "serial_number": req.serial_number or "",
        "found_date": req.found_date,
        "found_time": req.found_time,
        "found_location": req.found_location,
        "image_url": req.image_url or "",
        "additional_info": req.additional_info or "",
        "ai_features": ai_features,
        "status": "ACTIVE",
        "created_at": now_iso,
        "updated_at": now_iso
    }

    await db["found_reports"].insert_one(report_doc)
    
    # Auto AI Matching against active lost items
    matcher = MultimodalMatcher()
    cursor_lost = db["lost_reports"].find({"status": "ACTIVE"})
    lost_items = await cursor_lost.to_list(100)
    
    potential_matches_count = 0
    for lost in lost_items:
        if lost.get("user_id") != user_id:
            score_data = matcher.compute_match_score(lost, report_doc)
            if score_data["overall_match_score"] >= 70:
                potential_matches_count += 1
                # Notify the person who lost the item
                await create_system_notification(
                    db=db,
                    user_id=lost.get("user_id"),
                    notif_type="AI_MATCH",
                    title="Potential Match Found For Your Item!",
                    message=f"Someone just reported a found '{req.item_name}' that has a {score_data['overall_match_score']}% potential match with your lost item '{lost.get('item_name')}'.",
                    link="/lost/matches"
                )

    if potential_matches_count > 0:
        await create_system_notification(
            db=db,
            user_id=user_id,
            notif_type="AI_MATCH",
            title=f"{potential_matches_count} Potential Lost Item Match(es) Found",
            message=f"Your found report '{req.item_name}' has {potential_matches_count} potential match(es) in the lost items database.",
            link="/found/matches"
        )

    await log_security_event(
        action="FOUND_REPORT_CREATED",
        user_id=user_id,
        resource_type="FOUND_REPORT",
        resource_id=report_id,
        ip_address=request.client.host
    )

    return {
        "message": "Found item report created successfully.",
        "report": report_doc,
        "potential_matches_found": potential_matches_count
    }

@router.get("")
async def get_found_reports(
    user: Dict[str, Any] = Depends(RoleChecker(["FOUND_USER", "ADMIN"]))
):
    db = await get_database()
    query = {} if user["role"] == "ADMIN" else {"user_id": user["uuid"]}
    
    cursor = db["found_reports"].find(query).sort("created_at", -1)
    reports = await cursor.to_list(100)
    return {"reports": reports}

@router.get("/public/{report_id}")
async def get_found_report_public_preview(
    report_id: str,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Publicly safe preview for Item Details page (no passwords, emails, or phone numbers exposed).
    """
    db = await get_database()
    report = await db["found_reports"].find_one({
        "$or": [{"uuid": report_id}, {"id": report_id}, {"_id": report_id}]
    })
    if not report:
        raise HTTPException(status_code=404, detail="Found item report not found")
        
    clean = dict(report)
    clean.pop("_id", None)
    return {"report": clean}

@router.get("/{report_id}")
async def get_found_report_by_id(
    report_id: str,
    user: Dict[str, Any] = Depends(RoleChecker(["FOUND_USER", "ADMIN"]))
):
    db = await get_database()
    report = await db["found_reports"].find_one({"uuid": report_id})
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Found report not found")
        
    await verify_resource_ownership(user, report["user_id"])
    return report

@router.delete("/{report_id}")
async def cancel_found_report(
    report_id: str,
    request: Request,
    user: Dict[str, Any] = Depends(RoleChecker(["FOUND_USER", "ADMIN"]))
):
    db = await get_database()
    report = await db["found_reports"].find_one({"uuid": report_id})
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Found report not found")
        
    await verify_resource_ownership(user, report["user_id"])
    now_iso = datetime.now(timezone.utc).isoformat()
    
    await db["found_reports"].update_one(
        {"uuid": report_id},
        {"$set": {"status": "CANCELLED", "updated_at": now_iso}}
    )
    
    await log_security_event(
        action="FOUND_REPORT_CANCELLED",
        user_id=user["uuid"],
        resource_type="FOUND_REPORT",
        resource_id=report_id,
        ip_address=request.client.host
    )
    return {"message": "Found report cancelled successfully."}
