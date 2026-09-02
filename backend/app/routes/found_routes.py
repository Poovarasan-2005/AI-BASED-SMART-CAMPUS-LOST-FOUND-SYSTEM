from fastapi import APIRouter, HTTPException, Depends, status, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import uuid
from datetime import datetime
from app.database.db import get_database
from app.security.rbac import RoleChecker, verify_resource_ownership
from app.security.audit import log_security_event

router = APIRouter(prefix="/api/found/reports", tags=["Found Reports"])

class FoundReportCreateRequest(BaseModel):
    item_name: str
    category: str
    description: str
    brand: Optional[str] = ""
    model: Optional[str] = ""
    color: str
    serial_number: Optional[str] = ""
    found_date: str
    found_time: str
    found_location: str
    image_url: Optional[str] = ""

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_found_report(
    req: FoundReportCreateRequest,
    request: Request,
    user: Dict[str, Any] = Depends(RoleChecker(["FOUND_USER"]))
):
    db = await get_database()
    report_id = str(uuid.uuid4())
    user_id = user["uuid"]

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
        "found_date": req.found_date,
        "found_time": req.found_time,
        "found_location": req.found_location,
        "image_url": req.image_url,
        "ai_features": ai_features,
        "status": "ACTIVE",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }

    await db["found_reports"].insert_one(report_doc)
    
    await log_security_event(
        action="FOUND_REPORT_CREATED",
        user_id=user_id,
        resource_type="FOUND_REPORT",
        resource_id=report_id,
        ip_address=request.client.host
    )

    return {"message": "Found item report created successfully.", "report": report_doc}

@router.get("")
async def get_found_reports(
    user: Dict[str, Any] = Depends(RoleChecker(["FOUND_USER", "ADMIN"]))
):
    db = await get_database()
    query = {} if user["role"] == "ADMIN" else {"user_id": user["uuid"]}
    
    cursor = db["found_reports"].find(query).sort("created_at", -1)
    reports = await cursor.to_list(100)
    return {"reports": reports}

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
    
    await db["found_reports"].update_one(
        {"uuid": report_id},
        {"$set": {"status": "CANCELLED", "updated_at": datetime.utcnow().isoformat()}}
    )
    
    await log_security_event(
        action="FOUND_REPORT_CANCELLED",
        user_id=user["uuid"],
        resource_type="FOUND_REPORT",
        resource_id=report_id,
        ip_address=request.client.host
    )
    return {"message": "Found report cancelled successfully."}
