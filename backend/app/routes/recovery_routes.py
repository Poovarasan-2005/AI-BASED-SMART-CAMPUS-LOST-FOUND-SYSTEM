from fastapi import APIRouter, HTTPException, Depends, status, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from app.database.db import get_database
from app.security.rbac import RoleChecker
from app.security.audit import log_security_event
from app.services.recovery.handover_service import HandoverService

router = APIRouter(prefix="/api/recovery", tags=["Recovery & Handover"])

class VerifyQRRequest(BaseModel):
    qr_token: str

async def _find_recovery_record(db, recovery_id: str):
    """Robust helper to query recovery record by recovery_id, uuid, verification_request_id, qr_token, or id with case-insensitive scan fallback."""
    if not recovery_id:
        return None
    raw = str(recovery_id).strip()
    clean = raw.upper()

    # 1. Standard query
    rec = await db["recovery_records"].find_one({
        "$or": [
            {"recovery_id": raw},
            {"uuid": raw},
            {"verification_request_id": raw},
            {"qr_token": raw},
            {"id": raw},
            {"_id": raw},
            {"recovery_id": clean},
            {"verification_request_id": clean}
        ]
    })
    if rec:
        return rec

    # 2. Case-insensitive manual scan fallback
    try:
        col = db["recovery_records"]
        items = list(col.data.values()) if hasattr(col, "data") else []
        if not items and hasattr(col, "find"):
            cursor = col.find({})
            items = await cursor.to_list(1000)

        for item in items:
            for field in ["recovery_id", "uuid", "verification_request_id", "qr_token", "id", "_id"]:
                val = str(item.get(field, "")).strip()
                if val and (val == raw or val.upper() == clean):
                    return dict(item)
    except Exception as e:
        print(f"Recovery scan error: {e}")

    return None

@router.get("/{recovery_id}")
async def get_recovery_record(
    recovery_id: str,
    user: Dict[str, Any] = Depends(RoleChecker(["LOST_USER", "FOUND_USER", "ADMIN"]))
):
    db = await get_database()
    rec = await _find_recovery_record(db, recovery_id)
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Recovery record '{recovery_id}' not found.")
        
    lost_rep = await db["lost_reports"].find_one({"uuid": rec["lost_report_id"]})
    receipt = None
    if rec.get("handover_completed"):
        receipt = await HandoverService.generate_recovery_receipt(rec, lost_rep.get("item_name", "Item") if lost_rep else "Item")

    return {
        "recovery_record": rec,
        "receipt": receipt
    }

@router.post("/{recovery_id}/verify-qr")
async def verify_handover_qr(
    recovery_id: str,
    req: VerifyQRRequest,
    request: Request,
    user: Dict[str, Any] = Depends(RoleChecker(["FOUND_USER", "ADMIN", "LOST_USER"]))
):
    db = await get_database()
    rec = await _find_recovery_record(db, recovery_id)
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recovery record not found")

    if rec.get("qr_token") != req.qr_token.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid QR code token.")

    if rec.get("handover_completed"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Handover has already been completed for this item.")

    return {
        "valid": True,
        "message": "QR Code Verified successfully! Ready for physical item handover confirmation."
    }

@router.post("/{recovery_id}/complete")
async def complete_handover(
    recovery_id: str,
    request: Request,
    user: Dict[str, Any] = Depends(RoleChecker(["FOUND_USER", "ADMIN", "LOST_USER"]))
):
    db = await get_database()
    rec = await _find_recovery_record(db, recovery_id)
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recovery record not found")

    now_iso = datetime.utcnow().isoformat()

    await db["recovery_records"].update_one(
        {"_id": rec["_id"]},
        {"$set": {
            "handover_completed": True,
            "status": "RETURNED",
            "recovery_date": now_iso
        }}
    )

    await db["lost_reports"].update_one({"uuid": rec["lost_report_id"]}, {"$set": {"status": "RETURNED"}})
    await db["found_reports"].update_one({"uuid": rec["found_report_id"]}, {"$set": {"status": "RETURNED"}})

    lost_rep = await db["lost_reports"].find_one({"uuid": rec["lost_report_id"]})
    receipt = await HandoverService.generate_recovery_receipt(rec, lost_rep.get("item_name", "Item") if lost_rep else "Item")

    await log_security_event(
        action="HANDOVER_COMPLETED",
        user_id=user["uuid"],
        resource_type="RECOVERY_RECORD",
        resource_id=rec["recovery_id"],
        ip_address=request.client.host
    )

    return {
        "message": "Item handover completed successfully! Case closed.",
        "receipt": receipt
    }
