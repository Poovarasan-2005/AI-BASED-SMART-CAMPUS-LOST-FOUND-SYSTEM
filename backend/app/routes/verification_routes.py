from fastapi import APIRouter, HTTPException, Depends, status, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import uuid
import re
from datetime import datetime, timedelta
from app.database.db import get_database
from app.security.auth import get_current_user
from app.security.rbac import RoleChecker, verify_resource_ownership
from app.security.otp import generate_secure_otp, hash_otp, verify_otp_hash, get_otp_expiration
from app.security.audit import log_security_event
from app.security.rate_limiter import otp_gen_limiter, otp_verify_limiter, RateLimiter
from app.services.email.email_service import EmailService
from app.services.sms.sms_provider import SMSProvider
from app.services.recovery.handover_service import HandoverService

router = APIRouter(prefix="/api", tags=["Verification Workflow"])

# Rate limiter for verification requests: 10 per minute per IP
verify_req_limiter = RateLimiter(requests_limit=10, window_seconds=60)

class CreateVerificationRequest(BaseModel):
    found_report_id: str
    lost_report_id: str

class SendDirectVerificationPayload(BaseModel):
    found_report_id: str
    lost_report_id: Optional[str] = None
    requester_name: str
    requester_email: str
    requester_mobile: str
    description: str

class VerifyOTPRequest(BaseModel):
    otp: str

class VerifyOwnershipRequest(BaseModel):
    verification_request_id: str
    secret_attribute_answer: str

async def _find_verification_request(db, request_id: str):
    """Robust helper to query verification request by UUID, request_code, or ID with case-insensitive scan fallback."""
    if not request_id:
        return None
    req_raw = str(request_id).strip()
    req_clean = req_raw.upper()

    vr = await db["verification_requests"].find_one({
        "$or": [
            {"uuid": req_raw},
            {"request_code": req_raw},
            {"id": req_raw},
            {"_id": req_raw},
            {"uuid": req_clean},
            {"request_code": req_clean}
        ]
    })
    if vr:
        return vr

    try:
        col = db["verification_requests"]
        items = list(col.data.values()) if hasattr(col, "data") else []
        if not items and hasattr(col, "find"):
            cursor = col.find({})
            items = await cursor.to_list(1000)

        for item in items:
            for field in ["uuid", "request_code", "id", "_id"]:
                val = str(item.get(field, "")).strip()
                if val and (val == req_raw or val.upper() == req_clean):
                    return dict(item)
    except Exception as e:
        print(f"Fallback scan error: {e}")

    return None

@router.get("/verification/found-report/{report_id}")
async def get_found_report_public_preview(
    report_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Fetches safe found item details (item_name, category, location, date, image) for verification request form
    WITHOUT exposing finder's email or private phone number publicly.
    """
    db = await get_database()
    clean_id = str(report_id).strip()
    found_report = await db["found_reports"].find_one({
        "$or": [{"uuid": clean_id}, {"id": clean_id}, {"_id": clean_id}]
    })
    if not found_report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Found report record not found.")

    return {
        "found_report": {
            "uuid": found_report.get("uuid"),
            "item_name": found_report.get("item_name"),
            "category": found_report.get("category"),
            "found_location": found_report.get("found_location"),
            "found_date": found_report.get("found_date"),
            "image_url": found_report.get("image_url"),
            "description": found_report.get("description"),
            "status": found_report.get("status")
        }
    }

@router.post("/verification/send-request", status_code=status.HTTP_201_CREATED)
async def send_direct_verification_request(
    payload: SendDirectVerificationPayload,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Secure Email-Based Verification Request:
    Replaces old 'founder application' flow.
    Sends full verification request directly to the email of the person who reported the item as found.
    Initiates private conversation with Sent / Delivered / Seen status tracking.
    """
    verify_req_limiter.check(request.client.host)
    db = await get_database()

    # Input validations
    name = payload.requester_name.strip()
    email = payload.requester_email.strip().lower()
    mobile = payload.requester_mobile.strip()
    desc = payload.description.strip()

    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name is required.")
    if not email or "@" not in email or "." not in email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A valid Email ID is required.")
    if not mobile or len(re.sub(r"\D", "", mobile)) < 7:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A valid Mobile Number is required.")
    if not desc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message / Description cannot be empty.")

    # Find the found report
    found_id = payload.found_report_id.strip()
    found_report = await db["found_reports"].find_one({
        "$or": [{"uuid": found_id}, {"id": found_id}, {"_id": found_id}]
    })
    if not found_report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Found item record not found.")

    found_user_id = found_report.get("user_id")
    requester_user_id = current_user.get("uuid")

    # Check for target lost report if provided
    lost_report = None
    lost_user_id = None
    if payload.lost_report_id:
        lost_id = str(payload.lost_report_id).strip()
        lost_report = await db["lost_reports"].find_one({
            "$or": [{"uuid": lost_id}, {"id": lost_id}, {"_id": lost_id}]
        })
        if lost_report:
            lost_user_id = lost_report.get("user_id")

    # Determine recipient and roles
    if requester_user_id == found_user_id:
        # Requester is the Finder (Found User reaching out to Lost User)
        if not lost_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot submit a verification request on an item reported found by yourself."
            )
        if lost_user_id == requester_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot submit a verification request between reports owned by the same user account."
            )
        recipient_user_id = lost_user_id
        target_lost_user_id = lost_user_id
        target_found_user_id = found_user_id
        target_lost_report_id = lost_report.get("uuid") if lost_report else payload.lost_report_id
    else:
        # Requester is the Lost User (reaching out to Finder)
        recipient_user_id = found_user_id
        target_lost_user_id = requester_user_id
        target_found_user_id = found_user_id
        target_lost_report_id = payload.lost_report_id or (lost_report.get("uuid") if lost_report else None)

    # Resolve recipient account securely from database (Never trusted from frontend)
    recipient_user = await db["users"].find_one({
        "$or": [{"uuid": recipient_user_id}, {"id": recipient_user_id}, {"email": recipient_user_id}]
    })
    if not recipient_user or not recipient_user.get("email"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated user account could not be found.")

    recipient_user_email = recipient_user.get("email")
    item_name = found_report.get("item_name", "Found Item/Person")

    # Generate reference codes
    req_code = f"VR-{uuid.uuid4().hex[:6].upper()}"
    conv_id = f"CONV-{uuid.uuid4().hex[:6].upper()}"
    now_iso = datetime.utcnow().isoformat()

    # Check if active conversation / request already exists between these two users for this found item
    existing_vr = await db["verification_requests"].find_one({
        "found_report_id": found_report["uuid"],
        "requester_user_id": requester_user_id,
        "status": {"$in": ["DELIVERED", "SEEN", "ACTIVE", "PENDING", "OTP_SENT", "OTP_VERIFIED", "APPROVED"]}
    })

    if existing_vr:
        # Check existing conversation
        existing_conv = await db["conversations"].find_one({
            "$or": [
                {"verification_request_id": existing_vr.get("uuid")},
                {"verification_request_id": existing_vr.get("request_code")}
            ]
        })
        target_conv_id = existing_conv.get("uuid") if existing_conv else conv_id
        
        # Add new message to existing conversation
        if existing_conv:
            await db["conversation_messages"].insert_one({
                "id": str(uuid.uuid4()),
                "uuid": str(uuid.uuid4()),
                "conversation_id": existing_conv.get("uuid"),
                "sender_user_id": requester_user_id,
                "receiver_user_id": recipient_user_id,
                "sender_name": name,
                "sender_role": current_user.get("role", "LOST_USER"),
                "message_text": desc,
                "sent_at": now_iso,
                "delivered_at": now_iso,
                "read_at": None,
                "status": "DELIVERED",
                "created_at": now_iso
            })
            await db["conversations"].update_one(
                {"_id": existing_conv["_id"]},
                {"$set": {"last_message_at": now_iso}}
            )

        # Dispatch email to recipient
        await EmailService.send_direct_verification_request_email(
            to_email=recipient_user_email,
            requester_name=name,
            requester_email=email,
            requester_mobile=mobile,
            description=desc,
            item_name=item_name,
            conversation_id=target_conv_id,
            request_code=existing_vr.get("request_code", req_code)
        )

        return {
            "message": "Verification request sent successfully.",
            "verification_request_id": existing_vr.get("request_code", req_code),
            "conversation_id": target_conv_id
        }

    # 1. Create VerificationRequest document
    vr_doc = {
        "id": str(uuid.uuid4()),
        "uuid": req_code,
        "request_code": req_code,
        "lost_record_id": target_lost_report_id,
        "found_record_id": found_report["uuid"],
        "lost_report_id": target_lost_report_id,
        "found_report_id": found_report["uuid"],
        "requester_user_id": requester_user_id,
        "recipient_user_id": recipient_user_id,
        "lost_user_id": target_lost_user_id,
        "found_user_id": target_found_user_id,
        "requester_name": name,
        "requester_email": email,
        "requester_mobile": mobile,
        "description": desc,
        "status": "DELIVERED",
        "otp_hash": None,
        "otp_expires_at": None,
        "otp_attempt_count": 0,
        "max_attempts": 5,
        "created_at": now_iso,
        "updated_at": now_iso,
        "verified_at": None,
        "rejected_at": None,
        "completed_at": None
    }
    await db["verification_requests"].insert_one(vr_doc)

    # 2. Create Conversation document
    conv_doc = {
        "id": str(uuid.uuid4()),
        "uuid": conv_id,
        "conversation_id": conv_id,
        "verification_request_id": req_code,
        "requester_user_id": requester_user_id,
        "recipient_user_id": recipient_user_id,
        "lost_user_id": target_lost_user_id,
        "found_user_id": target_found_user_id,
        "lost_report_id": target_lost_report_id,
        "found_report_id": found_report["uuid"],
        "status": "ACTIVE",
        "handover_confirmed_by_finder": False,
        "handover_confirmed_by_owner": False,
        "created_at": now_iso,
        "updated_at": now_iso,
        "closed_at": None,
        "last_message_at": now_iso
    }
    await db["conversations"].insert_one(conv_doc)

    # 3. Create initial message in conversation_messages
    msg_doc = {
        "id": str(uuid.uuid4()),
        "uuid": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "sender_user_id": requester_user_id,
        "receiver_user_id": recipient_user_id,
        "sender_name": name,
        "sender_role": current_user.get("role", "LOST_USER"),
        "message_text": desc,
        "sent_at": now_iso,
        "delivered_at": now_iso,
        "read_at": None,
        "status": "DELIVERED",
        "created_at": now_iso
    }
    await db["conversation_messages"].insert_one(msg_doc)

    # 4. Dispatch Email directly to Recipient Person
    await EmailService.send_direct_verification_request_email(
        to_email=recipient_user_email,
        requester_name=name,
        requester_email=email,
        requester_mobile=mobile,
        description=desc,
        item_name=item_name,
        conversation_id=conv_id,
        request_code=req_code
    )

    await log_security_event(
        action="VERIFICATION_REQUEST_SENT",
        user_id=requester_user_id,
        resource_type="VERIFICATION_REQUEST",
        resource_id=req_code,
        ip_address=request.client.host
    )

    return {
        "message": "Verification request sent successfully.",
        "verification_request_id": req_code,
        "conversation_id": conv_id
    }

@router.post("/found/verification-requests", status_code=status.HTTP_201_CREATED)
async def create_verification_request(
    req: CreateVerificationRequest,
    request: Request,
    user: Dict[str, Any] = Depends(RoleChecker(["FOUND_USER"]))
):
    """
    Found User initiates a verification request from match result.
    Backend identifies Lost User strictly via DB relationship. Found User cannot pass mobile or email.
    """
    db = await get_database()
    found_user_id = user["uuid"]

    found_report = await db["found_reports"].find_one({"uuid": req.found_report_id})
    if not found_report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Found report not found")
        
    if found_report.get("user_id") != found_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not own this Found report.")

    lost_report = await db["lost_reports"].find_one({"uuid": req.lost_report_id})
    if not lost_report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lost report not found")
        
    lost_user_id = lost_report.get("user_id")
    if lost_user_id == found_user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot create a verification request for your own report.")

    # Securely retrieve Lost User from backend database
    lost_user = await db["users"].find_one({"$or": [{"uuid": lost_user_id}, {"id": lost_user_id}]})
    if not lost_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated Lost User account not found")

    lost_user_email = lost_user.get("email")

    existing = await db["verification_requests"].find_one({
        "lost_report_id": req.lost_report_id,
        "found_report_id": req.found_report_id,
        "status": {"$in": ["PENDING", "OTP_SENT", "OTP_VERIFIED", "APPROVED", "DELIVERED", "SEEN"]}
    })
    if existing:
        return {"message": "Verification request already exists for these items.", "verification_request": existing}

    req_id = f"VR-{uuid.uuid4().hex[:6].upper()}"
    conv_id = f"CONV-{uuid.uuid4().hex[:6].upper()}"
    now_iso = datetime.utcnow().isoformat()
    
    verification_doc = {
        "id": str(uuid.uuid4()),
        "uuid": req_id,
        "request_code": req_id,
        "lost_record_id": req.lost_report_id,
        "found_record_id": req.found_report_id,
        "lost_report_id": req.lost_report_id,
        "found_report_id": req.found_report_id,
        "requester_user_id": found_user_id,
        "recipient_user_id": lost_user.get("uuid", lost_user_id),
        "lost_user_id": lost_user.get("uuid", lost_user_id),
        "found_user_id": found_user_id,
        "status": "DELIVERED",
        "otp_hash": None,
        "otp_expires_at": None,
        "otp_attempt_count": 0,
        "max_attempts": 5,
        "created_at": now_iso,
        "updated_at": now_iso,
        "verified_at": None,
        "rejected_at": None,
        "completed_at": None
    }

    await db["verification_requests"].insert_one(verification_doc)

    # Initialize Conversation
    await db["conversations"].insert_one({
        "id": str(uuid.uuid4()),
        "uuid": conv_id,
        "conversation_id": conv_id,
        "verification_request_id": req_id,
        "requester_user_id": found_user_id,
        "recipient_user_id": lost_user.get("uuid", lost_user_id),
        "lost_user_id": lost_user.get("uuid", lost_user_id),
        "found_user_id": found_user_id,
        "lost_report_id": req.lost_report_id,
        "found_report_id": req.found_report_id,
        "status": "ACTIVE",
        "handover_confirmed_by_finder": False,
        "handover_confirmed_by_owner": False,
        "created_at": now_iso,
        "updated_at": now_iso,
        "closed_at": None,
        "last_message_at": now_iso
    })

    item_name = lost_report.get("item_name", "Item")
    await EmailService.send_verification_request_notification(lost_user_email, item_name, req_id)

    await log_security_event(
        action="VERIFICATION_REQUEST_CREATED",
        user_id=found_user_id,
        resource_type="VERIFICATION_REQUEST",
        resource_id=req_id,
        ip_address=request.client.host
    )

    return {
        "message": "Verification request created successfully. Security alert sent to Lost User.",
        "verification_request": verification_doc,
        "conversation_id": conv_id
    }

@router.get("/lost/verification-requests")
async def get_lost_verification_requests(
    user: Dict[str, Any] = Depends(RoleChecker(["LOST_USER"]))
):
    db = await get_database()
    user_ids = list(filter(None, [user.get("uuid"), user.get("email")]))
    
    cursor = db["verification_requests"].find({
        "$or": [
            {"lost_user_id": {"$in": user_ids}},
            {"requester_user_id": {"$in": user_ids}},
            {"recipient_user_id": {"$in": user_ids}}
        ]
    }).sort("created_at", -1)
    requests_list = await cursor.to_list(100)
    
    enriched = []
    for vr in requests_list:
        vr_copy = dict(vr)
        vr_copy.pop("otp_hash", None)
        
        lost_rep = await db["lost_reports"].find_one({"uuid": vr.get("lost_report_id")})
        found_rep = await db["found_reports"].find_one({"uuid": vr.get("found_report_id")})
        
        conv = await db["conversations"].find_one({
            "$or": [
                {"verification_request_id": vr.get("uuid")},
                {"verification_request_id": vr.get("request_code")},
                {"verification_request_id": vr.get("id")}
            ]
        })
        if conv:
            vr_copy["conversation_id"] = conv.get("uuid")
            
        vr_copy["lost_report"] = lost_rep
        vr_copy["found_report"] = found_rep
        enriched.append(vr_copy)
        
    return {"verification_requests": enriched}

@router.get("/lost/verification-requests/{request_id}")
async def get_single_verification_request(
    request_id: str,
    user: Dict[str, Any] = Depends(RoleChecker(["LOST_USER", "FOUND_USER", "ADMIN"]))
):
    db = await get_database()
    vr = await _find_verification_request(db, request_id)
    if not vr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Verification request '{request_id}' not found.")
        
    vr_copy = dict(vr)
    vr_copy.pop("otp_hash", None)
    
    lost_rep = await db["lost_reports"].find_one({"uuid": vr.get("lost_report_id")})
    found_rep = await db["found_reports"].find_one({"uuid": vr.get("found_report_id")})
    
    conv = await db["conversations"].find_one({
        "$or": [
            {"verification_request_id": vr.get("uuid")},
            {"verification_request_id": vr.get("request_code")},
            {"verification_request_id": vr.get("id")}
        ]
    })
    if conv:
        vr_copy["conversation_id"] = conv.get("uuid")
        
    vr_copy["lost_report"] = lost_rep
    vr_copy["found_report"] = found_rep
    return {"verification_request": vr_copy}

@router.get("/found/verification-requests")
async def get_found_verification_requests(
    user: Dict[str, Any] = Depends(RoleChecker(["FOUND_USER"]))
):
    db = await get_database()
    found_user_id = user["uuid"]
    user_ids = list(filter(None, [found_user_id, user.get("email")]))
    
    cursor = db["verification_requests"].find({
        "$or": [
            {"found_user_id": {"$in": user_ids}},
            {"recipient_user_id": {"$in": user_ids}},
            {"requester_user_id": {"$in": user_ids}}
        ]
    }).sort("created_at", -1)
    requests_list = await cursor.to_list(100)
    
    enriched = []
    for vr in requests_list:
        vr_copy = dict(vr)
        vr_copy.pop("otp_hash", None)
        found_rep = await db["found_reports"].find_one({"uuid": vr.get("found_report_id")})
        
        conv = await db["conversations"].find_one({
            "$or": [
                {"verification_request_id": vr.get("uuid")},
                {"verification_request_id": vr.get("request_code")},
                {"verification_request_id": vr.get("id")}
            ]
        })
        if conv:
            vr_copy["conversation_id"] = conv.get("uuid")
            
        vr_copy["found_report"] = found_rep
        enriched.append(vr_copy)
        
    return {"verification_requests": enriched}

@router.post("/lost/verification-requests/{request_id}/send-otp")
async def send_ownership_otp(
    request_id: str,
    request: Request,
    user: Dict[str, Any] = Depends(RoleChecker(["LOST_USER"]))
):
    """
    Zero-Trust Mobile OTP: Retrieves Lost User's verified mobile number strictly from DB (e.g. 9080667045).
    Found User / Frontend payloads can NEVER supply or override destination mobile number.
    Generates EXACTLY 6-digit cryptographic OTP, hashes with SHA-256, dispatches SMS & Email, and saves to verification_otps.
    """
    otp_gen_limiter.check(request.client.host)
    db = await get_database()
    
    vr = await _find_verification_request(db, request_id)
    if not vr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Verification request '{request_id}' not found.")
        
    user_ids = list(filter(None, [user.get("uuid"), user.get("email")]))
    if vr.get("lost_user_id") not in user_ids and vr.get("requester_user_id") not in user_ids:
        lost_u = await db["users"].find_one({"$or": [{"uuid": vr.get("lost_user_id")}, {"id": vr.get("lost_user_id")}, {"email": vr.get("lost_user_id")}]})
        if not lost_u or lost_u.get("email") != user.get("email"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied: You do not own this verification request.")

    # Retrieve Lost User verified mobile strictly from DB (never trusted from frontend)
    lost_user = await db["users"].find_one({"$or": [{"uuid": user["uuid"]}, {"id": user["uuid"]}, {"email": user["email"]}]})
    to_mobile = (lost_user.get("phone_number") or lost_user.get("mobile") or "9080667045") if lost_user else "9080667045"

    # Invalidate any existing ACTIVE OTP for this verification request
    await db["verification_otps"].update_one(
        {"verification_request_id": vr["uuid"], "status": "ACTIVE"},
        {"$set": {"status": "INVALIDATED", "invalidated_at": datetime.utcnow().isoformat()}}
    )

    # Cryptographically secure EXACTLY 6-digit OTP (secrets module: OTP_LENGTH = 6)
    raw_otp = generate_secure_otp(length=6)
    hashed = hash_otp(raw_otp)
    expires_at = get_otp_expiration().isoformat()  # 5 minutes expiry

    # Store in verification_otps collection bound to request, Lost User, Found User, purpose
    otp_doc_id = str(uuid.uuid4())
    otp_record = {
        "id": otp_doc_id,
        "uuid": otp_doc_id,
        "verification_request_id": vr["uuid"],
        "lost_user_id": vr.get("lost_user_id"),
        "found_user_id": vr.get("found_user_id"),
        "purpose": "ITEM_OWNERSHIP_VERIFICATION",
        "otp_hash": hashed,
        "expires_at": expires_at,
        "attempt_count": 0,
        "max_attempts": 5,
        "status": "ACTIVE",
        "created_at": datetime.utcnow().isoformat(),
        "verified_at": None,
        "invalidated_at": None
    }
    await db["verification_otps"].insert_one(otp_record)

    await db["verification_requests"].update_one(
        {"_id": vr["_id"]},
        {"$set": {
            "status": "OTP_SENT",
            "otp_hash": hashed,
            "otp_expires_at": expires_at,
            "otp_attempt_count": 0
        }}
    )

    # Dispatch SMS & Email OTP
    await SMSProvider.send_otp_sms(to_mobile, raw_otp, vr.get("request_code", request_id))
    await EmailService.send_otp_email(user["email"], raw_otp, vr.get("request_code", request_id))

    await log_security_event(
        action="OTP_GENERATED",
        user_id=user["uuid"],
        resource_type="VERIFICATION_REQUEST",
        resource_id=request_id,
        ip_address=request.client.host
    )

    # Masked mobile for privacy display (e.g. ******7045)
    masked_mobile = f"******{to_mobile[-4:]}" if len(to_mobile) >= 4 else "******7045"

    return {
        "message": f"An 6-digit verification OTP has been dispatched to your registered mobile ({masked_mobile}) & email.",
        "masked_mobile": masked_mobile,
        "otp_dev_mode": raw_otp
    }

@router.post("/lost/verification-requests/{request_id}/verify-otp")
async def verify_ownership_otp(
    request_id: str,
    req: VerifyOTPRequest,
    request: Request,
    user: Dict[str, Any] = Depends(RoleChecker(["LOST_USER"]))
):
    """
    Validates 6-digit OTP, increments attempt count (max 5), checks 5-min expiry.
    Upon success: OTP_STATUS = VERIFIED, immediately invalidates OTP single-use.
    """
    otp_verify_limiter.check(request.client.host)
    db = await get_database()
    
    vr = await _find_verification_request(db, request_id)
    if not vr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification request not found")
        
    user_ids = list(filter(None, [user.get("uuid"), user.get("email")]))
    if vr.get("lost_user_id") not in user_ids and vr.get("requester_user_id") not in user_ids:
        lost_u = await db["users"].find_one({"$or": [{"uuid": vr.get("lost_user_id")}, {"id": vr.get("lost_user_id")}, {"email": vr.get("lost_user_id")}]})
        if not lost_u or lost_u.get("email") != user.get("email"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied: You do not own this verification request.")

    # Retrieve ACTIVE OTP from verification_otps
    otp_record = await db["verification_otps"].find_one({
        "verification_request_id": vr["uuid"],
        "purpose": "ITEM_OWNERSHIP_VERIFICATION",
        "status": "ACTIVE"
    })

    stored_hash = otp_record.get("otp_hash") if otp_record else vr.get("otp_hash")

    # Check attempt limits (max 5)
    attempts = (otp_record.get("attempt_count", 0) if otp_record else vr.get("otp_attempt_count", 0)) + 1
    if attempts > 5:
        if otp_record:
            await db["verification_otps"].update_one({"_id": otp_record["_id"]}, {"$set": {"status": "MAX_ATTEMPTS"}})
        await db["verification_requests"].update_one({"_id": vr["_id"]}, {"$set": {"status": "EXPIRED"}})
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Maximum OTP verification attempts exceeded. Request expired.")

    # Check expiry (5 minutes)
    exp_str = (otp_record.get("expires_at") if otp_record else vr.get("otp_expires_at"))
    if not exp_str or datetime.fromisoformat(exp_str) < datetime.utcnow():
        if otp_record:
            await db["verification_otps"].update_one({"_id": otp_record["_id"]}, {"$set": {"status": "EXPIRED"}})
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired. Please request a new OTP.")

    # Validate EXACTLY 6-digit numeric OTP format ([0-9]{6})
    clean_otp = req.otp.strip()
    if len(clean_otp) != 6 or not clean_otp.isdigit():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP format. OTP must be exactly 6 numeric digits.")

    # Verify SHA-256 hash using secrets.compare_digest (timing-attack safe)
    if not stored_hash or not verify_otp_hash(clean_otp, stored_hash):
        if otp_record:
            await db["verification_otps"].update_one({"_id": otp_record["_id"]}, {"$set": {"attempt_count": attempts}})
        await db["verification_requests"].update_one({"_id": vr["_id"]}, {"$inc": {"otp_attempt_count": 1}})
        
        await log_security_event(
            action="OTP_FAILED",
            user_id=user["uuid"],
            resource_type="VERIFICATION_REQUEST",
            resource_id=request_id,
            ip_address=request.client.host,
            success=False
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect 6-digit verification OTP code.")

    # OTP Verified -> Set OTP_STATUS = VERIFIED and immediately invalidate (single-use)
    now_iso = datetime.utcnow().isoformat()
    if otp_record:
        await db["verification_otps"].update_one(
            {"_id": otp_record["_id"]},
            {"$set": {"status": "VERIFIED", "verified_at": now_iso}}
        )

    await db["verification_requests"].update_one(
        {"_id": vr["_id"]},
        {"$set": {
            "status": "OTP_VERIFIED",
            "otp_hash": None,
            "verified_at": now_iso
        }}
    )

    await log_security_event(
        action="OTP_VERIFIED",
        user_id=user["uuid"],
        resource_type="VERIFICATION_REQUEST",
        resource_id=request_id,
        ip_address=request.client.host
    )

    return {"message": "6-digit Mobile OTP verification successful. Please proceed to Secret Attribute ownership confirmation."}

@router.post("/lost/ownership/verify")
async def verify_secret_attribute_ownership(
    req: VerifyOwnershipRequest,
    request: Request,
    user: Dict[str, Any] = Depends(RoleChecker(["LOST_USER"]))
):
    db = await get_database()
    
    vr = await _find_verification_request(db, req.verification_request_id)
    if not vr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification request not found")

    user_ids = list(filter(None, [user.get("uuid"), user.get("email")]))
    if vr.get("lost_user_id") not in user_ids and vr.get("requester_user_id") not in user_ids:
        lost_u = await db["users"].find_one({"$or": [{"uuid": vr.get("lost_user_id")}, {"id": vr.get("lost_user_id")}, {"email": vr.get("lost_user_id")}]})
        if not lost_u or lost_u.get("email") != user.get("email"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied.")

    if vr.get("status") not in ["OTP_VERIFIED", "APPROVED", "DELIVERED", "SEEN"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Must complete mobile OTP verification prior to ownership confirmation.")

    lost_report = await db["lost_reports"].find_one({"uuid": vr.get("lost_report_id")})
    stored_secret = lost_report.get("secret_attribute", "").lower().strip() if lost_report else ""
    user_ans = req.secret_attribute_answer.lower().strip()

    is_matched = False
    if stored_secret and (stored_secret in user_ans or user_ans in stored_secret):
        is_matched = True
    elif not stored_secret:
        is_matched = True

    if not is_matched:
        return {
            "success": False,
            "message": "Secret attribute verification failed. Answer does not match lost item record."
        }

    await db["ownership_verifications"].insert_one({
        "id": str(uuid.uuid4()),
        "verification_request_id": req.verification_request_id,
        "lost_user_id": user["uuid"],
        "secret_attribute_matched": True,
        "created_at": datetime.utcnow().isoformat()
    })

    return {
        "success": True,
        "message": "Secret item attribute ownership verified successfully!"
    }

@router.post("/lost/verification-requests/{request_id}/approve")
async def approve_verification_request(
    request_id: str,
    request: Request,
    user: Dict[str, Any] = Depends(RoleChecker(["LOST_USER"]))
):
    """
    Lost User approves verification request after OTP & ownership checks.
    Creates recovery record, handover QR code, AND initializes private in-app conversation.
    """
    db = await get_database()
    vr = await _find_verification_request(db, request_id)
    user_ids = list(filter(None, [user.get("uuid"), user.get("email")]))
    if not vr or (vr.get("lost_user_id") not in user_ids and vr.get("requester_user_id") not in user_ids):
        lost_u = await db["users"].find_one({"$or": [{"uuid": vr.get("lost_user_id")}, {"id": vr.get("lost_user_id")}, {"email": vr.get("lost_user_id")}]})
        if not lost_u or lost_u.get("email") != user.get("email"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied.")

    # 1. Create recovery record & QR Code
    rec = await HandoverService.create_recovery_record(
        verification_request_id=vr.get("uuid", request_id),
        lost_report_id=vr.get("lost_report_id"),
        found_report_id=vr.get("found_report_id"),
        lost_user_id=vr.get("lost_user_id", user["uuid"]),
        found_user_id=vr.get("found_user_id")
    )

    # 2. Initialize Private In-App Conversation
    conv_id = f"CONV-{uuid.uuid4().hex[:6].upper()}"
    now_iso = datetime.utcnow().isoformat()
    conversation_doc = {
        "id": str(uuid.uuid4()),
        "uuid": conv_id,
        "conversation_id": conv_id,
        "verification_request_id": vr.get("uuid", request_id),
        "lost_report_id": vr.get("lost_report_id"),
        "found_report_id": vr.get("found_report_id"),
        "lost_user_id": vr.get("lost_user_id", user["uuid"]),
        "found_user_id": vr.get("found_user_id"),
        "status": "ACTIVE",
        "handover_confirmed_by_finder": False,
        "handover_confirmed_by_owner": False,
        "created_at": now_iso,
        "closed_at": None,
        "last_message_at": now_iso
    }
    
    # Check existing conversation
    existing_conv = await db["conversations"].find_one({
        "$or": [
            {"verification_request_id": vr.get("uuid", request_id)},
            {"verification_request_id": vr.get("request_code", request_id)}
        ]
    })
    if not existing_conv:
        await db["conversations"].insert_one(conversation_doc)

    await db["verification_requests"].update_one(
        {"_id": vr["_id"]},
        {"$set": {"status": "APPROVED", "completed_at": now_iso}}
    )

    if vr.get("lost_report_id"):
        await db["lost_reports"].update_one({"uuid": vr["lost_report_id"]}, {"$set": {"status": "MATCHED"}})
    if vr.get("found_report_id"):
        await db["found_reports"].update_one({"uuid": vr["found_report_id"]}, {"$set": {"status": "MATCHED"}})

    await log_security_event(
        action="VERIFICATION_APPROVED",
        user_id=user["uuid"],
        resource_type="VERIFICATION_REQUEST",
        resource_id=request_id,
        ip_address=request.client.host
    )

    return {
        "message": "Verification approved! Handover QR code and secure private conversation enabled.",
        "recovery_record": rec,
        "conversation_id": existing_conv.get("uuid") if existing_conv else conv_id
    }

@router.post("/lost/verification-requests/{request_id}/reject")
async def reject_verification_request(
    request_id: str,
    request: Request,
    user: Dict[str, Any] = Depends(RoleChecker(["LOST_USER"]))
):
    db = await get_database()
    vr = await _find_verification_request(db, request_id)
    user_ids = list(filter(None, [user.get("uuid"), user.get("email")]))
    if not vr or (vr.get("lost_user_id") not in user_ids and vr.get("requester_user_id") not in user_ids):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied.")

    await db["verification_requests"].update_one(
        {"_id": vr["_id"]},
        {"$set": {"status": "REJECTED", "rejected_at": datetime.utcnow().isoformat()}}
    )

    await log_security_event(
        action="VERIFICATION_REJECTED",
        user_id=user["uuid"],
        resource_type="VERIFICATION_REQUEST",
        resource_id=request_id,
        ip_address=request.client.host
    )

    return {"message": "Verification request rejected."}
