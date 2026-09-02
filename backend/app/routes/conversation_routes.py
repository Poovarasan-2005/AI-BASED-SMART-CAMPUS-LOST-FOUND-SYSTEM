from fastapi import APIRouter, HTTPException, Depends, status, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import uuid
import html
from datetime import datetime
from app.database.db import get_database
from app.security.auth import get_current_user
from app.security.audit import log_security_event
from app.security.rate_limiter import RateLimiter
from app.services.email.email_service import EmailService

router = APIRouter(prefix="/api/conversations", tags=["Private Conversations"])

# Rate limiter: max 30 chat messages per minute per IP/User
chat_limiter = RateLimiter(requests_limit=30, window_seconds=60)

class SendMessageRequest(BaseModel):
    message: str

class ShareContactRequest(BaseModel):
    field_type: str  # "EMAIL" or "PHONE"
    consent: bool

class HandoverScheduleRequest(BaseModel):
    location: str
    date_time: str

class ReportAbuseRequest(BaseModel):
    reason: str
    description: str

async def _find_conversation(db, conv_id: str):
    """Robust helper to query conversation by UUID, conversation_id, verification_request_id, or ID with case-insensitive fallback."""
    if not conv_id:
        return None
    raw_id = str(conv_id).strip()
    clean_id = raw_id.upper()

    conv = await db["conversations"].find_one({
        "$or": [
            {"uuid": raw_id},
            {"conversation_id": raw_id},
            {"verification_request_id": raw_id},
            {"id": raw_id},
            {"_id": raw_id},
            {"uuid": clean_id},
            {"conversation_id": clean_id},
            {"verification_request_id": clean_id}
        ]
    })
    if conv:
        return conv

    try:
        col = db["conversations"]
        items = list(col.data.values()) if hasattr(col, "data") else []
        if not items and hasattr(col, "find"):
            cursor = col.find({})
            items = await cursor.to_list(1000)

        for item in items:
            for field in ["uuid", "conversation_id", "verification_request_id", "id", "_id"]:
                val = str(item.get(field, "")).strip()
                if val and (val == raw_id or val.upper() == clean_id):
                    return dict(item)
    except Exception as e:
        print(f"Fallback conversation scan error: {e}")

    return None

async def _get_user_identifiers(db, current_user: Dict[str, Any]) -> set:
    """Collects all possible identifiers (uuid, id, _id, email) for the authenticated user to prevent BOLA mismatches."""
    user_id = current_user.get("uuid")
    user_email = current_user.get("email")
    identifiers = set()
    if user_id: identifiers.add(str(user_id))
    if user_email: identifiers.add(str(user_email))

    db_user = await db["users"].find_one({
        "$or": [
            {"uuid": user_id},
            {"id": user_id},
            {"email": user_email}
        ]
    })
    if db_user:
        if db_user.get("uuid"): identifiers.add(str(db_user.get("uuid")))
        if db_user.get("id"): identifiers.add(str(db_user.get("id")))
        if db_user.get("_id"): identifiers.add(str(db_user.get("_id")))
        if db_user.get("email"): identifiers.add(str(db_user.get("email")))

    return {i for i in identifiers if i}

@router.get("")
async def list_user_conversations(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns authenticated user's active private conversations.
    Enforces Object-Level Authorization (BOLA/IDOR check).
    """
    db = await get_database()
    user_ids = list(await _get_user_identifiers(db, current_user))

    cursor = db["conversations"].find({
        "$or": [
            {"lost_user_id": {"$in": user_ids}},
            {"found_user_id": {"$in": user_ids}},
            {"requester_user_id": {"$in": user_ids}},
            {"recipient_user_id": {"$in": user_ids}}
        ]
    }).sort("last_message_at", -1)

    conv_list = await cursor.to_list(100)
    enriched = []

    for conv in conv_list:
        c_copy = dict(conv)
        lost_rep = await db["lost_reports"].find_one({"uuid": conv.get("lost_report_id")})
        found_rep = await db["found_reports"].find_one({"uuid": conv.get("found_report_id")})

        lost_u_id = conv.get("lost_user_id") or conv.get("requester_user_id")
        found_u_id = conv.get("found_user_id") or conv.get("recipient_user_id")

        lost_u = await db["users"].find_one({
            "$or": [{"uuid": lost_u_id}, {"id": lost_u_id}, {"email": lost_u_id}]
        })
        found_u = await db["users"].find_one({
            "$or": [{"uuid": found_u_id}, {"id": found_u_id}, {"email": found_u_id}]
        })

        is_lost = (conv.get("lost_user_id") in user_ids) or (conv.get("requester_user_id") in user_ids)

        c_copy["item_name"] = lost_rep.get("item_name") if lost_rep else (found_rep.get("item_name") if found_rep else "Found Item/Person")
        c_copy["other_participant_name"] = (found_u.get("full_name") if found_u else "Finder") if is_lost else (lost_u.get("full_name") if lost_u else "Requester")
        c_copy["user_role"] = "LOST_USER" if is_lost else "FOUND_USER"
        enriched.append(c_copy)

    return {"conversations": enriched}

@router.get("/{conv_id}")
async def get_conversation_details(
    conv_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    db = await get_database()
    conv = await _find_conversation(db, conv_id)
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    user_ids = await _get_user_identifiers(db, current_user)
    is_participant = (
        (conv.get("lost_user_id") in user_ids) or
        (conv.get("found_user_id") in user_ids) or
        (conv.get("requester_user_id") in user_ids) or
        (conv.get("recipient_user_id") in user_ids)
    )

    # BOLA / IDOR Protection: Must be participant or ADMIN
    if current_user.get("role") != "ADMIN" and not is_participant:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied: You are not a participant in this conversation.")

    lost_u_id = conv.get("lost_user_id") or conv.get("requester_user_id")
    found_u_id = conv.get("found_user_id") or conv.get("recipient_user_id")

    lost_u = await db["users"].find_one({"$or": [{"uuid": lost_u_id}, {"id": lost_u_id}, {"email": lost_u_id}]})
    found_u = await db["users"].find_one({"$or": [{"uuid": found_u_id}, {"id": found_u_id}, {"email": found_u_id}]})

    lost_rep = await db["lost_reports"].find_one({"uuid": conv.get("lost_report_id")})
    found_rep = await db["found_reports"].find_one({"uuid": conv.get("found_report_id")})

    # Mask contact info unless consent was granted
    lost_phone_consent = await db["contact_share_consents"].find_one({"conversation_id": conv["uuid"], "user_id": lost_u_id, "field_type": "PHONE", "consent": True})
    lost_email_consent = await db["contact_share_consents"].find_one({"conversation_id": conv["uuid"], "user_id": lost_u_id, "field_type": "EMAIL", "consent": True})
    
    found_phone_consent = await db["contact_share_consents"].find_one({"conversation_id": conv["uuid"], "user_id": found_u_id, "field_type": "PHONE", "consent": True})
    found_email_consent = await db["contact_share_consents"].find_one({"conversation_id": conv["uuid"], "user_id": found_u_id, "field_type": "EMAIL", "consent": True})

    lost_raw_phone = lost_u.get("phone_number") or lost_u.get("mobile") or "9080667045" if lost_u else ""
    found_raw_phone = found_u.get("phone_number") or found_u.get("mobile") or "9876543210" if found_u else ""

    item_title = lost_rep.get("item_name") if lost_rep else (found_rep.get("item_name") if found_rep else "Found Item/Person")

    return {
        "conversation": conv,
        "item_name": item_title,
        "lost_user": {
            "name": lost_u.get("full_name", "Lost Owner") if lost_u else "Lost Owner",
            "email": lost_u.get("email") if (lost_email_consent or current_user.get("uuid") == lost_u_id) else (f"***@{lost_u.get('email').split('@')[-1]}" if (lost_u and lost_u.get('email')) else "******@campus.edu"),
            "phone": lost_raw_phone if (lost_phone_consent or current_user.get("uuid") == lost_u_id) else f"******{lost_raw_phone[-4:] if len(lost_raw_phone)>=4 else '7045'}"
        },
        "found_user": {
            "name": found_u.get("full_name", "Finder") if found_u else "Finder",
            "email": found_u.get("email") if (found_email_consent or current_user.get("uuid") == found_u_id) else (f"***@{found_u.get('email').split('@')[-1]}" if (found_u and found_u.get('email')) else "******@campus.edu"),
            "phone": found_raw_phone if (found_phone_consent or current_user.get("uuid") == found_u_id) else f"******{found_raw_phone[-4:] if len(found_raw_phone)>=4 else '3210'}"
        }
    }

@router.get("/{conv_id}/messages")
async def get_conversation_messages(
    conv_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Fetches messages for private conversation.
    When the recipient reads the messages, marks unread messages as SEEN and sets read_at timestamp.
    """
    db = await get_database()
    conv = await _find_conversation(db, conv_id)
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    user_ids = await _get_user_identifiers(db, current_user)
    is_participant = (
        (conv.get("lost_user_id") in user_ids) or
        (conv.get("found_user_id") in user_ids) or
        (conv.get("requester_user_id") in user_ids) or
        (conv.get("recipient_user_id") in user_ids)
    )

    # BOLA Protection Check
    if current_user.get("role") != "ADMIN" and not is_participant:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied: You are not an authorized participant.")

    now_iso = datetime.utcnow().isoformat()

    # Mark unread messages directed to this user as SEEN
    # Recipient is opening the conversation!
    try:
        col = db["conversation_messages"]
        all_msgs = []
        if hasattr(col, "data"):
            all_msgs = list(col.data.values())
        else:
            cursor = col.find({"conversation_id": conv["uuid"]})
            all_msgs = await cursor.to_list(1000)

        for m in all_msgs:
            if m.get("conversation_id") == conv["uuid"]:
                # If current user is the receiver and message is not seen yet
                if (m.get("receiver_user_id") in user_ids) and (m.get("read_at") is None or m.get("status") != "SEEN"):
                    await db["conversation_messages"].update_one(
                        {"_id": m.get("_id")},
                        {"$set": {"status": "SEEN", "read_at": now_iso}}
                    )

        # Update associated verification request status if DELIVERED
        vr_id = conv.get("verification_request_id")
        if vr_id:
            await db["verification_requests"].update_one(
                {"$or": [{"uuid": vr_id}, {"request_code": vr_id}], "status": "DELIVERED"},
                {"$set": {"status": "SEEN", "updated_at": now_iso}}
            )
    except Exception as e:
        print(f"Error updating message read status: {e}")

    cursor = db["conversation_messages"].find({"conversation_id": conv["uuid"]}).sort("created_at", 1)
    msgs = await cursor.to_list(500)
    
    # Format messages
    enriched = []
    for m in msgs:
        m_copy = dict(m)
        if not m_copy.get("sent_at"):
            m_copy["sent_at"] = m_copy.get("created_at", now_iso)
        if not m_copy.get("delivered_at"):
            m_copy["delivered_at"] = m_copy.get("sent_at")
        if not m_copy.get("status"):
            m_copy["status"] = "SEEN" if m_copy.get("read_at") else "DELIVERED"
        enriched.append(m_copy)

    return {"messages": enriched}

@router.post("/{conv_id}/messages")
async def send_conversation_message(
    conv_id: str,
    req: SendMessageRequest,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Sends message in private conversation.
    Enforces rate limits (30 msg/min), HTML sanitization, and sends privacy-preserving email notification (zero plaintext leakage).
    Sets sent_at, delivered_at, status = DELIVERED, read_at = None.
    """
    chat_limiter.check(request.client.host)
    db = await get_database()

    conv = await _find_conversation(db, conv_id)
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    user_ids = await _get_user_identifiers(db, current_user)
    is_participant = (
        (conv.get("lost_user_id") in user_ids) or
        (conv.get("found_user_id") in user_ids) or
        (conv.get("requester_user_id") in user_ids) or
        (conv.get("recipient_user_id") in user_ids)
    )

    if not is_participant:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied: You are not a participant in this conversation.")

    if conv.get("status") in ["CLOSED", "BLOCKED"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Conversation is closed or blocked. No new messages permitted.")

    # Max length & XSS sanitization
    raw_msg = req.message.strip()
    if not raw_msg or len(raw_msg) > 10000:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message length must be between 1 and 10,000 characters.")

    safe_text = html.escape(raw_msg)
    msg_id = str(uuid.uuid4())
    now_iso = datetime.utcnow().isoformat()

    # Determine recipient
    is_lost = (conv.get("lost_user_id") in user_ids) or (conv.get("requester_user_id") in user_ids)
    recipient_id = (conv.get("found_user_id") or conv.get("recipient_user_id")) if is_lost else (conv.get("lost_user_id") or conv.get("requester_user_id"))

    msg_doc = {
        "id": msg_id,
        "uuid": msg_id,
        "conversation_id": conv["uuid"],
        "sender_user_id": current_user.get("uuid"),
        "receiver_user_id": recipient_id,
        "sender_name": current_user.get("full_name", "User"),
        "sender_role": current_user.get("role", "LOST_USER"),
        "message_text": safe_text,
        "sent_at": now_iso,
        "delivered_at": now_iso,
        "read_at": None,
        "status": "DELIVERED",
        "created_at": now_iso
    }

    await db["conversation_messages"].insert_one(msg_doc)

    # Update conversation last_message_at
    await db["conversations"].update_one(
        {"_id": conv["_id"]},
        {"$set": {"last_message_at": now_iso, "updated_at": now_iso}}
    )

    # Send Privacy-Preserving Email Notification to recipient
    recipient_user = await db["users"].find_one({
        "$or": [{"uuid": recipient_id}, {"id": recipient_id}, {"email": recipient_id}]
    })

    if recipient_user and recipient_user.get("email"):
        found_rep = await db["found_reports"].find_one({"uuid": conv.get("found_report_id")})
        lost_rep = await db["lost_reports"].find_one({"uuid": conv.get("lost_report_id")})
        item_title = (found_rep.get("item_name") if found_rep else None) or (lost_rep.get("item_name") if lost_rep else "Found Item/Person")

        recipient_role = "FOUND_USER" if is_lost else "LOST_USER"
        await EmailService.send_conversation_reply_email(
            to_email=recipient_user["email"],
            sender_name=current_user.get("full_name", "Participant"),
            item_name=item_title,
            conversation_id=conv["uuid"],
            recipient_role=recipient_role
        )

    await log_security_event(
        action="MESSAGE_SENT",
        user_id=current_user.get("uuid"),
        resource_type="CONVERSATION",
        resource_id=conv["uuid"],
        ip_address=request.client.host
    )

    return {"message": "Message sent successfully.", "message_doc": msg_doc}

@router.post("/{conv_id}/contact-share")
async def share_contact_consent(
    conv_id: str,
    req: ShareContactRequest,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    db = await get_database()
    conv = await _find_conversation(db, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    user_ids = await _get_user_identifiers(db, current_user)
    is_participant = (
        (conv.get("lost_user_id") in user_ids) or
        (conv.get("found_user_id") in user_ids) or
        (conv.get("requester_user_id") in user_ids) or
        (conv.get("recipient_user_id") in user_ids)
    )

    if not is_participant:
        raise HTTPException(status_code=403, detail="Access Denied.")

    is_lost = (conv.get("lost_user_id") in user_ids) or (conv.get("requester_user_id") in user_ids)
    recipient_id = (conv.get("found_user_id") or conv.get("recipient_user_id")) if is_lost else (conv.get("lost_user_id") or conv.get("requester_user_id"))

    consent_doc = {
        "id": str(uuid.uuid4()),
        "conversation_id": conv["uuid"],
        "user_id": current_user.get("uuid"),
        "shared_with_user_id": recipient_id,
        "field_type": req.field_type.upper(),  # "EMAIL" or "PHONE"
        "consent": req.consent,
        "created_at": datetime.utcnow().isoformat()
    }

    await db["contact_share_consents"].insert_one(consent_doc)

    await log_security_event(
        action="CONTACT_SHARED" if req.consent else "CONTACT_REVOKED",
        user_id=current_user.get("uuid"),
        resource_type="CONVERSATION",
        resource_id=conv["uuid"],
        ip_address=request.client.host,
        metadata={"field_type": req.field_type}
    )

    return {"message": f"Consent for {req.field_type} sharing updated."}

@router.post("/{conv_id}/handover")
async def schedule_safe_handover(
    conv_id: str,
    req: HandoverScheduleRequest,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    db = await get_database()
    conv = await _find_conversation(db, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    user_ids = await _get_user_identifiers(db, current_user)
    is_participant = (
        (conv.get("lost_user_id") in user_ids) or
        (conv.get("found_user_id") in user_ids) or
        (conv.get("requester_user_id") in user_ids) or
        (conv.get("recipient_user_id") in user_ids)
    )

    if not is_participant:
        raise HTTPException(status_code=403, detail="Access Denied.")

    now_iso = datetime.utcnow().isoformat()
    handover_info = {
        "handover_location": html.escape(req.location),
        "handover_time": html.escape(req.date_time),
        "updated_by": current_user.get("uuid"),
        "updated_at": now_iso
    }

    await db["conversations"].update_one(
        {"_id": conv["_id"]},
        {"$set": {"handover_info": handover_info, "last_message_at": now_iso}}
    )

    # Insert system event message into conversation thread
    sys_msg = {
        "id": str(uuid.uuid4()),
        "uuid": str(uuid.uuid4()),
        "conversation_id": conv["uuid"],
        "sender_user_id": "SYSTEM",
        "receiver_user_id": "ALL",
        "sender_name": "Campus Handover Coordinator",
        "sender_role": "SYSTEM",
        "message_text": f"Safe Handover Scheduled:\nLocation: {req.location}\nTime: {req.date_time}",
        "sent_at": now_iso,
        "delivered_at": now_iso,
        "read_at": None,
        "status": "DELIVERED",
        "created_at": now_iso
    }
    await db["conversation_messages"].insert_one(sys_msg)

    await log_security_event(
        action="HANDOVER_SCHEDULED",
        user_id=current_user.get("uuid"),
        resource_type="CONVERSATION",
        resource_id=conv["uuid"],
        ip_address=request.client.host,
        metadata=handover_info
    )

    return {"message": "Safe Handover details saved and posted to private conversation thread."}

@router.post("/{conv_id}/confirm-handover")
async def confirm_item_handover(
    conv_id: str,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Double Handover Confirmation:
    Both Finder & Lost Owner must confirm handover before the case is closed and marked RETURNED.
    """
    db = await get_database()
    conv = await _find_conversation(db, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    user_ids = await _get_user_identifiers(db, current_user)
    is_lost = (conv.get("lost_user_id") in user_ids) or (conv.get("requester_user_id") in user_ids)
    is_found = (conv.get("found_user_id") in user_ids) or (conv.get("recipient_user_id") in user_ids)

    if not is_lost and not is_found:
        raise HTTPException(status_code=403, detail="Access Denied.")

    update_fields = {}
    now_iso = datetime.utcnow().isoformat()

    if is_found:
        update_fields["handover_confirmed_by_finder"] = True
        update_fields["finder_confirmed_at"] = now_iso
    if is_lost:
        update_fields["handover_confirmed_by_owner"] = True
        update_fields["owner_confirmed_at"] = now_iso

    await db["conversations"].update_one({"_id": conv["_id"]}, {"$set": update_fields})
    updated_conv = await db["conversations"].find_one({"_id": conv["_id"]})

    both_confirmed = (
        updated_conv.get("handover_confirmed_by_finder") and
        updated_conv.get("handover_confirmed_by_owner")
    )

    if both_confirmed:
        await db["conversations"].update_one(
            {"_id": conv["_id"]},
            {"$set": {"status": "CLOSED", "closed_at": now_iso}}
        )
        if conv.get("lost_report_id"):
            await db["lost_reports"].update_one({"uuid": conv["lost_report_id"]}, {"$set": {"status": "RETURNED"}})
        if conv.get("found_report_id"):
            await db["found_reports"].update_one({"uuid": conv["found_report_id"]}, {"$set": {"status": "RETURNED"}})

        await db["conversation_messages"].insert_one({
            "id": str(uuid.uuid4()),
            "uuid": str(uuid.uuid4()),
            "conversation_id": conv["uuid"],
            "sender_user_id": "SYSTEM",
            "receiver_user_id": "ALL",
            "sender_name": "Campus Security & System Audit",
            "sender_role": "SYSTEM",
            "message_text": "Item Handover Completed! Both parties have confirmed physical recovery. This case is officially closed.",
            "sent_at": now_iso,
            "delivered_at": now_iso,
            "read_at": None,
            "status": "DELIVERED",
            "created_at": now_iso
        })

    await log_security_event(
        action="HANDOVER_CONFIRMED",
        user_id=current_user.get("uuid"),
        resource_type="CONVERSATION",
        resource_id=conv["uuid"],
        ip_address=request.client.host,
        metadata={"both_confirmed": both_confirmed}
    )

    return {
        "message": "Handover confirmed successfully! " + ("Case closed and item marked RETURNED." if both_confirmed else "Awaiting other party confirmation."),
        "both_confirmed": bool(both_confirmed),
        "status": "CLOSED" if both_confirmed else updated_conv.get("status")
    }

@router.post("/{conv_id}/report")
async def report_abuse(
    conv_id: str,
    req: ReportAbuseRequest,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    db = await get_database()
    conv = await _find_conversation(db, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    user_ids = await _get_user_identifiers(db, current_user)
    is_participant = (
        (conv.get("lost_user_id") in user_ids) or
        (conv.get("found_user_id") in user_ids) or
        (conv.get("requester_user_id") in user_ids) or
        (conv.get("recipient_user_id") in user_ids)
    )

    if not is_participant:
        raise HTTPException(status_code=403, detail="Access Denied.")

    is_lost = (conv.get("lost_user_id") in user_ids) or (conv.get("requester_user_id") in user_ids)
    reported_user_id = (conv.get("found_user_id") or conv.get("recipient_user_id")) if is_lost else (conv.get("lost_user_id") or conv.get("requester_user_id"))

    report_doc = {
        "id": str(uuid.uuid4()),
        "conversation_id": conv["uuid"],
        "reporter_user_id": current_user.get("uuid"),
        "reported_user_id": reported_user_id,
        "reason": html.escape(req.reason),
        "description": html.escape(req.description),
        "status": "PENDING_REVIEW",
        "created_at": datetime.utcnow().isoformat()
    }
    await db["abuse_reports"].insert_one(report_doc)

    await log_security_event(
        action="ABUSE_REPORTED",
        user_id=current_user.get("uuid"),
        resource_type="CONVERSATION",
        resource_id=conv["uuid"],
        ip_address=request.client.host,
        metadata={"reason": req.reason}
    )

    return {"message": "Report submitted to Campus Security for review."}

@router.post("/{conv_id}/block")
async def block_conversation(
    conv_id: str,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    db = await get_database()
    conv = await _find_conversation(db, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    user_ids = await _get_user_identifiers(db, current_user)
    is_participant = (
        (conv.get("lost_user_id") in user_ids) or
        (conv.get("found_user_id") in user_ids) or
        (conv.get("requester_user_id") in user_ids) or
        (conv.get("recipient_user_id") in user_ids)
    )

    if not is_participant:
        raise HTTPException(status_code=403, detail="Access Denied.")

    await db["conversations"].update_one(
        {"_id": conv["_id"]},
        {"$set": {"status": "BLOCKED", "blocked_by": current_user.get("uuid"), "blocked_at": datetime.utcnow().isoformat()}}
    )

    await log_security_event(
        action="CONVERSATION_BLOCKED",
        user_id=current_user.get("uuid"),
        resource_type="CONVERSATION",
        resource_id=conv["uuid"],
        ip_address=request.client.host
    )

    return {"message": "Conversation locked and user blocked."}
