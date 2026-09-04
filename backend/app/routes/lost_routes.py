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

router = APIRouter(prefix="/api/lost/reports", tags=["Lost Reports"])

class LostReportCreateRequest(BaseModel):
    item_name: str
    category: str
    description: str
    brand: Optional[str] = ""
    model: Optional[str] = ""
    color: str
    unique_features: Optional[str] = ""
    serial_number: Optional[str] = ""
    lost_date: str
    lost_time: str
    lost_location: str
    image_url: Optional[str] = ""
    additional_info: Optional[str] = ""
    secret_attribute: Optional[str] = ""

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_lost_report(
    req: LostReportCreateRequest,
    request: Request,
    user: Dict[str, Any] = Depends(RoleChecker(["LOST_USER", "ADMIN"]))
):
    """
    Creates a new Lost Item Report with all Section 6 fields.
    Automatically initiates AI matching against active found items and sends in-app notifications if matches are found.
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
        "lost_date": req.lost_date,
        "lost_time": req.lost_time,
        "lost_location": req.lost_location,
        "image_url": req.image_url or "",
        "additional_info": req.additional_info or "",
        "secret_attribute": req.secret_attribute or "",
        "ai_features": ai_features,
        "status": "ACTIVE",
        "created_at": now_iso,
        "updated_at": now_iso
    }

    await db["lost_reports"].insert_one(report_doc)
    
    # Check for immediate AI potential matches
    matcher = MultimodalMatcher()
    cursor_found = db["found_reports"].find({"status": "ACTIVE"})
    found_items = await cursor_found.to_list(100)
    
    potential_matches_count = 0
    for found in found_items:
        if found.get("user_id") != user_id:
            score_data = matcher.compute_match_score(report_doc, found)
            if score_data["overall_match_score"] >= 70:
                potential_matches_count += 1
                # Notify finder
                await create_system_notification(
                    db=db,
                    user_id=found.get("user_id"),
                    notif_type="AI_MATCH",
                    title="Potential AI Match Discovered",
                    message=f"A newly reported lost item '{req.item_name}' has a {score_data['overall_match_score']}% potential match with your found report '{found.get('item_name')}'.",
                    link="/found/matches"
                )

    if potential_matches_count > 0:
        await create_system_notification(
            db=db,
            user_id=user_id,
            notif_type="AI_MATCH",
            title=f"{potential_matches_count} Potential Match(es) Found!",
            message=f"Our AI matching engine found {potential_matches_count} potential match(es) for your item '{req.item_name}'.",
            link="/lost/matches"
        )

    await log_security_event(
        action="LOST_REPORT_CREATED",
        user_id=user_id,
        resource_type="LOST_REPORT",
        resource_id=report_id,
        ip_address=request.client.host
    )

    return {
        "message": "Lost item report created successfully.",
        "report": report_doc,
        "potential_matches_found": potential_matches_count
    }

@router.get("")
async def get_lost_reports(
    user: Dict[str, Any] = Depends(RoleChecker(["LOST_USER", "ADMIN"]))
):
    db = await get_database()
    query = {} if user["role"] == "ADMIN" else {"user_id": user["uuid"]}
    
    cursor = db["lost_reports"].find(query).sort("created_at", -1)
    reports = await cursor.to_list(100)
    
    # Strip secret attribute before outputting unless admin or owner
    for r in reports:
        if user["role"] != "ADMIN" and r.get("user_id") != user["uuid"]:
            r.pop("secret_attribute", None)
            
    return {"reports": reports}

@router.get("/public/{report_id}")
async def get_lost_report_public_preview(
    report_id: str,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Publicly safe preview for Item Details page (no passwords, emails, mobile numbers, or secret attributes exposed).
    """
    db = await get_database()
    report = await db["lost_reports"].find_one({
        "$or": [{"uuid": report_id}, {"id": report_id}, {"_id": report_id}]
    })
    if not report:
        raise HTTPException(status_code=404, detail="Lost item report not found")
        
    clean = dict(report)
    clean.pop("secret_attribute", None)
    clean.pop("_id", None)
    return {"report": clean}

@router.get("/{report_id}")
async def get_lost_report_by_id(
    report_id: str,
    user: Dict[str, Any] = Depends(RoleChecker(["LOST_USER", "ADMIN"]))
):
    db = await get_database()
    report = await db["lost_reports"].find_one({"uuid": report_id})
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lost report not found")
        
    await verify_resource_ownership(user, report["user_id"])
    return report

@router.delete("/{report_id}")
async def cancel_lost_report(
    report_id: str,
    request: Request,
    user: Dict[str, Any] = Depends(RoleChecker(["LOST_USER", "ADMIN"]))
):
    db = await get_database()
    report = await db["lost_reports"].find_one({"uuid": report_id})
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lost report not found")
        
    await verify_resource_ownership(user, report["user_id"])
    now_iso = datetime.now(timezone.utc).isoformat()
    
    await db["lost_reports"].update_one(
        {"uuid": report_id},
        {"$set": {"status": "CANCELLED", "updated_at": now_iso}}
    )
    
    await log_security_event(
        action="LOST_REPORT_CANCELLED",
        user_id=user["uuid"],
        resource_type="LOST_REPORT",
        resource_id=report_id,
        ip_address=request.client.host
    )
    return {"message": "Report cancelled successfully."}
