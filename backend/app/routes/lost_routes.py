from fastapi import APIRouter, HTTPException, Depends, status, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import uuid
from datetime import datetime
from app.database.db import get_database
from app.security.rbac import RoleChecker, verify_resource_ownership
from app.security.audit import log_security_event
from app.services.matching.image_processor import ImageProcessor

router = APIRouter(prefix="/api/lost/reports", tags=["Lost Reports"])

class LostReportCreateRequest(BaseModel):
    item_name: str
    category: str
    description: str
    brand: Optional[str] = ""
    model: Optional[str] = ""
    color: str
    serial_number: Optional[str] = ""
    lost_date: str
    lost_time: str
    lost_location: str
    image_url: Optional[str] = ""
    secret_attribute: Optional[str] = ""

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_lost_report(
    req: LostReportCreateRequest,
    request: Request,
    user: Dict[str, Any] = Depends(RoleChecker(["LOST_USER"]))
):
    db = await get_database()
    report_id = str(uuid.uuid4())
    user_id = user["uuid"]

    # Extract visual features if image present
    ai_features = {"dominant_color": req.color, "color_vector": []}
    
    report_doc = {
        "id": report_id,
        "uuid": report_id,
        "user_id": user_id,
        "item_name": req.item_name,
        "category": req.category,
        "description": req.description,
        "brand": req.brand,
        "model": req.model,
        "color": req.color,
        "serial_number": req.serial_number,
        "lost_date": req.lost_date,
        "lost_time": req.lost_time,
        "lost_location": req.lost_location,
        "image_url": req.image_url,
        "secret_attribute": req.secret_attribute,
        "ai_features": ai_features,
        "status": "ACTIVE",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }

    await db["lost_reports"].insert_one(report_doc)
    
    await log_security_event(
        action="LOST_REPORT_CREATED",
        user_id=user_id,
        resource_type="LOST_REPORT",
        resource_id=report_id,
        ip_address=request.client.host
    )

    return {"message": "Lost item report created successfully.", "report": report_doc}

@router.get("")
async def get_lost_reports(
    user: Dict[str, Any] = Depends(RoleChecker(["LOST_USER", "ADMIN"]))
):
    db = await get_database()
    # If ADMIN, can view all. If LOST_USER, can view ONLY own reports to prevent BOLA/IDOR
    query = {} if user["role"] == "ADMIN" else {"user_id": user["uuid"]}
    
    cursor = db["lost_reports"].find(query).sort("created_at", -1)
    reports = await cursor.to_list(100)
    
    # Strip secret attribute before outputting
    for r in reports:
        if user["role"] != "ADMIN" and r.get("user_id") != user["uuid"]:
            r.pop("secret_attribute", None)
            
    return {"reports": reports}

@router.get("/{report_id}")
async def get_lost_report_by_id(
    report_id: str,
    user: Dict[str, Any] = Depends(RoleChecker(["LOST_USER", "ADMIN"]))
):
    db = await get_database()
    report = await db["lost_reports"].find_one({"uuid": report_id})
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lost report not found")
        
    # IDOR Protection
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
    
    await db["lost_reports"].update_one(
        {"uuid": report_id},
        {"$set": {"status": "CANCELLED", "updated_at": datetime.utcnow().isoformat()}}
    )
    
    await log_security_event(
        action="LOST_REPORT_CANCELLED",
        user_id=user["uuid"],
        resource_type="LOST_REPORT",
        resource_id=report_id,
        ip_address=request.client.host
    )
    return {"message": "Report cancelled successfully."}
