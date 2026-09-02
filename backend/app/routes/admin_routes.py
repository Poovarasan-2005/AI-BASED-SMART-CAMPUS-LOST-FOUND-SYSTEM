from fastapi import APIRouter, HTTPException, Depends, status, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from app.database.db import get_database
from app.security.rbac import RoleChecker
from app.security.audit import log_security_event

router = APIRouter(prefix="/api/admin", tags=["Admin Portal"])

class SuspendUserRequest(BaseModel):
    user_id: str
    action: str  # "SUSPEND" or "ACTIVATE"

@router.get("/dashboard")
async def get_admin_dashboard(
    user: Dict[str, Any] = Depends(RoleChecker(["ADMIN"]))
):
    db = await get_database()
    
    total_users = await db["users"].count_documents({})
    lost_users = await db["users"].count_documents({"role": "LOST_USER"})
    found_users = await db["users"].count_documents({"role": "FOUND_USER"})
    
    total_lost = await db["lost_reports"].count_documents({})
    total_found = await db["found_reports"].count_documents({})
    
    pending_vr = await db["verification_requests"].count_documents({"status": "PENDING"})
    recovered_items = await db["recovery_records"].count_documents({"status": "RETURNED"})
    
    recovery_rate = 0.0
    if total_lost > 0:
        recovery_rate = round((recovered_items / float(total_lost)) * 100.0, 1)

    return {
        "metrics": {
            "total_users": total_users,
            "lost_users": lost_users,
            "found_users": found_users,
            "total_lost_reports": total_lost,
            "total_found_reports": total_found,
            "pending_verifications": pending_vr,
            "recovered_items": recovered_items,
            "recovery_rate": f"{recovery_rate}%",
            "raw_recovery_rate": recovery_rate
        }
    }

@router.get("/analytics")
async def get_admin_analytics(
    user: Dict[str, Any] = Depends(RoleChecker(["ADMIN"]))
):
    db = await get_database()
    
    cursor_lost = db["lost_reports"].find({})
    lost_reports = await cursor_lost.to_list(1000)
    
    location_counts: Dict[str, int] = {}
    category_counts: Dict[str, int] = {}
    
    for r in lost_reports:
        loc = r.get("lost_location", "Unknown").title()
        cat = r.get("category", "Other").title()
        
        location_counts[loc] = location_counts.get(loc, 0) + 1
        category_counts[cat] = category_counts.get(cat, 0) + 1

    sorted_locations = sorted([{"location": k, "count": v} for k, v in location_counts.items()], key=lambda x: x["count"], reverse=True)
    sorted_categories = sorted([{"category": k, "count": v} for k, v in category_counts.items()], key=lambda x: x["count"], reverse=True)

    return {
        "most_common_lost_locations": sorted_locations[:5],
        "category_distribution": sorted_categories,
        "total_analyzed": len(lost_reports)
    }

@router.get("/recovered-items")
async def list_recovered_items(
    user: Dict[str, Any] = Depends(RoleChecker(["ADMIN"]))
):
    db = await get_database()
    cursor = db["recovery_records"].find({}).sort("created_at", -1)
    records = await cursor.to_list(200)
    
    enriched = []
    for rec in records:
        rec_copy = dict(rec)
        lost_rep = await db["lost_reports"].find_one({"uuid": rec.get("lost_report_id")})
        found_rep = await db["found_reports"].find_one({"uuid": rec.get("found_report_id")})
        lost_u = await db["users"].find_one({"uuid": rec.get("lost_user_id")})
        found_u = await db["users"].find_one({"uuid": rec.get("found_user_id")})
        
        rec_copy["lost_report"] = lost_rep
        rec_copy["found_report"] = found_rep
        rec_copy["lost_user"] = lost_u.get("full_name") if lost_u else "Lost User"
        rec_copy["found_user"] = found_u.get("full_name") if found_u else "Finder"
        enriched.append(rec_copy)
        
    return {"recovered_items": enriched}

@router.get("/all-lost-reports")
async def list_all_lost_reports(
    user: Dict[str, Any] = Depends(RoleChecker(["ADMIN"]))
):
    db = await get_database()
    cursor = db["lost_reports"].find({}).sort("created_at", -1)
    reports = await cursor.to_list(200)
    return {"lost_reports": reports}

@router.get("/all-found-reports")
async def list_all_found_reports(
    user: Dict[str, Any] = Depends(RoleChecker(["ADMIN"]))
):
    db = await get_database()
    cursor = db["found_reports"].find({}).sort("created_at", -1)
    reports = await cursor.to_list(200)
    return {"found_reports": reports}

@router.get("/users")
async def list_admin_users(
    user: Dict[str, Any] = Depends(RoleChecker(["ADMIN"]))
):
    db = await get_database()
    cursor = db["users"].find({}).sort("created_at", -1)
    users_list = await cursor.to_list(200)
    
    for u in users_list:
        u.pop("password_hash", None)
    return {"users": users_list}

@router.post("/suspend-user")
async def suspend_user(
    req: SuspendUserRequest,
    request: Request,
    user: Dict[str, Any] = Depends(RoleChecker(["ADMIN"]))
):
    db = await get_database()
    target = await db["users"].find_one({"uuid": req.user_id})
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    new_status = "SUSPENDED" if req.action.upper() == "SUSPEND" else "ACTIVE"
    await db["users"].update_one({"uuid": req.user_id}, {"$set": {"account_status": new_status}})

    await log_security_event(
        action="ACCOUNT_SUSPENDED" if new_status == "SUSPENDED" else "ACCOUNT_ACTIVATED",
        user_id=user["uuid"],
        resource_type="USER",
        resource_id=req.user_id,
        ip_address=request.client.host
    )

    return {"message": f"User account status updated to '{new_status}' successfully."}

@router.get("/audit-logs")
async def list_audit_logs(
    user: Dict[str, Any] = Depends(RoleChecker(["ADMIN"]))
):
    db = await get_database()
    cursor = db["security_audit_logs"].find({}).sort("created_at", -1)
    logs = await cursor.to_list(200)
    return {"audit_logs": logs}
