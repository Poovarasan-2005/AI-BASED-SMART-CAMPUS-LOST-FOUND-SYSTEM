import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend"))

from app.database.db import get_database
from app.security.auth import hash_password

async def seed_demo_data():
    """
    Seeds the database with sample Lost User, Found User, Admin, reports, notifications, and verification requests.
    """
    db = await get_database()
    print("Seeding Smart Campus Lost & Found System Demo Data...")

    # Clear existing demo collections for clean demonstration
    for col in ["users", "lost_reports", "found_reports", "verification_requests", "conversations", "conversation_messages", "recovery_records", "notifications", "security_audit_logs"]:
        if hasattr(db[col], "data"):
            db[col].data.clear()

    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Create Lost User
    lost_user_id = "user-lost-001"
    lost_user = {
        "id": lost_user_id,
        "uuid": lost_user_id,
        "full_name": "Alexander Pierce (Lost User)",
        "email": "lost.user@campus.edu",
        "password_hash": hash_password("LostPass123!"),
        "role": "LOST_USER",
        "mobile": "+19876543210",
        "department": "Computer Science & Engineering",
        "year": "3rd Year",
        "email_verified": True,
        "phone_verified": True,
        "account_status": "ACTIVE",
        "created_at": now_iso,
        "updated_at": now_iso
    }
    await db["users"].insert_one(lost_user)

    # 2. Create Found User
    found_user_id = "user-found-001"
    found_user = {
        "id": found_user_id,
        "uuid": found_user_id,
        "full_name": "Sophia Bennett (Found User)",
        "email": "found.user@campus.edu",
        "password_hash": hash_password("FoundPass123!"),
        "role": "FOUND_USER",
        "mobile": "+19876543211",
        "department": "Electrical Engineering",
        "year": "2nd Year",
        "email_verified": True,
        "phone_verified": True,
        "account_status": "ACTIVE",
        "created_at": now_iso,
        "updated_at": now_iso
    }
    await db["users"].insert_one(found_user)

    # 3. Create Admin User
    admin_user_id = "user-admin-001"
    admin_user = {
        "id": admin_user_id,
        "uuid": admin_user_id,
        "full_name": "Campus Security Administrator",
        "email": "admin@campuslostfound.edu",
        "password_hash": hash_password("AdminPass123!"),
        "role": "ADMIN",
        "mobile": "+19876543299",
        "phone_number": "+19876543299",
        "phone_verified": True,
        "department": "Campus Security & IT",
        "year": "Staff",
        "email_verified": True,
        "account_status": "ACTIVE",
        "created_at": now_iso,
        "updated_at": now_iso
    }
    await db["users"].insert_one(admin_user)

    # 4. Create Lost Items
    lost_items = [
        {
            "id": "report-lost-001",
            "uuid": "report-lost-001",
            "user_id": lost_user_id,
            "item_name": "Black Samsung Galaxy S24 Ultra",
            "category": "Mobile Phone",
            "description": "Black Samsung S24 phone with clear protective cover lost in Central Library reading room.",
            "brand": "Samsung",
            "model": "Galaxy S24 Ultra",
            "color": "Black",
            "unique_features": "Small blue star sticker inside the clear phone case",
            "serial_number": "S24-ULTRA-88392",
            "lost_date": "2026-08-25",
            "lost_time": "13:30",
            "lost_location": "Library",
            "image_url": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop",
            "additional_info": "Screen has a matte screen protector.",
            "secret_attribute": "Small blue star sticker inside the clear phone case",
            "ai_features": {"dominant_color": "Black", "color_vector": [0.1, 0.4, 0.5, 0.2]},
            "status": "ACTIVE",
            "created_at": now_iso,
            "updated_at": now_iso
        },
        {
            "id": "report-lost-002",
            "uuid": "report-lost-002",
            "user_id": lost_user_id,
            "item_name": "Space Gray MacBook Air M2",
            "category": "Laptop",
            "description": "13-inch Space Gray MacBook Air left on bench near Science Hall lab 302.",
            "brand": "Apple",
            "model": "MacBook Air M2",
            "color": "Gray",
            "unique_features": "GitHub octocat sticker on bottom left corner",
            "serial_number": "C02G879QMD6R",
            "lost_date": "2026-08-24",
            "lost_time": "16:00",
            "lost_location": "Science Block",
            "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop",
            "additional_info": "Carried in a dark navy felt sleeve.",
            "secret_attribute": "Octocat sticker and small dent on right hinge",
            "ai_features": {"dominant_color": "Gray", "color_vector": [0.3, 0.3, 0.3, 0.1]},
            "status": "ACTIVE",
            "created_at": now_iso,
            "updated_at": now_iso
        },
        {
            "id": "report-lost-003",
            "uuid": "report-lost-003",
            "user_id": lost_user_id,
            "item_name": "Campus Student ID Badge",
            "category": "College ID",
            "description": "Student identification card in blue campus lanyard with RFID chip.",
            "brand": "Campus Security",
            "model": "Student Card 2026",
            "color": "Blue",
            "unique_features": "Alexander Pierce / Dept of CSE / ID 2023-CS-0491",
            "serial_number": "2023-CS-0491",
            "lost_date": "2026-08-26",
            "lost_time": "11:15",
            "lost_location": "Student Union",
            "image_url": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop",
            "additional_info": "Has library barcode on back.",
            "secret_attribute": "Barcode ends with digits 8812",
            "ai_features": {"dominant_color": "Blue", "color_vector": [0.1, 0.2, 0.7, 0.3]},
            "status": "ACTIVE",
            "created_at": now_iso,
            "updated_at": now_iso
        }
    ]

    for item in lost_items:
        await db["lost_reports"].insert_one(item)

    # 5. Create Found Items
    found_items = [
        {
            "id": "report-found-001",
            "uuid": "report-found-001",
            "user_id": found_user_id,
            "item_name": "Black Samsung Smartphone",
            "category": "Mobile Phone",
            "description": "Found a black Samsung smartphone lying on the 2nd floor desk near Central Library.",
            "brand": "Samsung",
            "model": "Galaxy S24",
            "color": "Black",
            "unique_features": "Clear case with a star decoration",
            "serial_number": "S24-ULTRA-88392",
            "found_date": "2026-08-25",
            "found_time": "13:45",
            "found_location": "Library",
            "image_url": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop",
            "additional_info": "Turned in to library reception staff desk.",
            "ai_features": {"dominant_color": "Black", "color_vector": [0.1, 0.4, 0.5, 0.2]},
            "status": "ACTIVE",
            "created_at": now_iso,
            "updated_at": now_iso
        },
        {
            "id": "report-found-002",
            "uuid": "report-found-002",
            "user_id": found_user_id,
            "item_name": "Apple MacBook Air Laptop",
            "category": "Laptop",
            "description": "Found Space Gray Apple laptop resting on table outside Science Block room 304.",
            "brand": "Apple",
            "model": "MacBook Air",
            "color": "Gray",
            "unique_features": "Has tech stickers on chassis",
            "serial_number": "C02G879QMD6R",
            "found_date": "2026-08-24",
            "found_time": "16:30",
            "found_location": "Science Block",
            "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop",
            "additional_info": "Found inside protective sleeve.",
            "ai_features": {"dominant_color": "Gray", "color_vector": [0.3, 0.3, 0.3, 0.1]},
            "status": "ACTIVE",
            "created_at": now_iso,
            "updated_at": now_iso
        },
        {
            "id": "report-found-003",
            "uuid": "report-found-003",
            "user_id": found_user_id,
            "item_name": "Student Identification Card (CSE)",
            "category": "College ID",
            "description": "Found a university student ID card near Student Union cafeteria register.",
            "brand": "University",
            "model": "ID Badge",
            "color": "Blue",
            "unique_features": "Student Name Alexander / Blue lanyard",
            "serial_number": "2023-CS-0491",
            "found_date": "2026-08-26",
            "found_time": "11:30",
            "found_location": "Student Union",
            "image_url": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop",
            "additional_info": "Kept securely with campus security.",
            "ai_features": {"dominant_color": "Blue", "color_vector": [0.1, 0.2, 0.7, 0.3]},
            "status": "ACTIVE",
            "created_at": now_iso,
            "updated_at": now_iso
        },
        {
            "id": "report-found-004",
            "uuid": "report-found-004",
            "user_id": found_user_id,
            "item_name": "Stainless Steel Water Bottle",
            "category": "Accessories",
            "description": "Found blue vacuum insulated sports water bottle near Gymnasium bleachers.",
            "brand": "Hydro Flask",
            "model": "32 oz Wide Mouth",
            "color": "Blue",
            "unique_features": "Camp hiking sticker on side",
            "serial_number": "",
            "found_date": "2026-08-26",
            "found_time": "09:00",
            "found_location": "Sports Complex",
            "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&auto=format&fit=crop",
            "additional_info": "Clean condition.",
            "ai_features": {"dominant_color": "Blue", "color_vector": [0.1, 0.1, 0.8, 0.1]},
            "status": "ACTIVE",
            "created_at": now_iso,
            "updated_at": now_iso
        }
    ]

    for item in found_items:
        await db["found_reports"].insert_one(item)

    # 6. Create Active Verification Request & Conversation
    req_code = "VR-928401"
    conv_id = "CONV-772183"

    vr_doc = {
        "id": req_code,
        "uuid": req_code,
        "request_code": req_code,
        "lost_record_id": "report-lost-001",
        "found_record_id": "report-found-001",
        "lost_report_id": "report-lost-001",
        "found_report_id": "report-found-001",
        "requester_user_id": lost_user_id,
        "recipient_user_id": found_user_id,
        "lost_user_id": lost_user_id,
        "found_user_id": found_user_id,
        "requester_name": "Alexander Pierce",
        "requester_email": "lost.user@campus.edu",
        "requester_mobile": "+19876543210",
        "description": "Hello Sophia, I believe the Samsung phone you found at the Central Library is mine. It has a blue star sticker inside the clear case and a matte screen protector.",
        "status": "SEEN",
        "created_at": now_iso,
        "updated_at": now_iso
    }
    await db["verification_requests"].insert_one(vr_doc)

    conv_doc = {
        "id": conv_id,
        "uuid": conv_id,
        "conversation_id": conv_id,
        "verification_request_id": req_code,
        "requester_user_id": lost_user_id,
        "recipient_user_id": found_user_id,
        "lost_user_id": lost_user_id,
        "found_user_id": found_user_id,
        "lost_report_id": "report-lost-001",
        "found_report_id": "report-found-001",
        "status": "ACTIVE",
        "handover_confirmed_by_finder": False,
        "handover_confirmed_by_owner": False,
        "created_at": now_iso,
        "updated_at": now_iso,
        "last_message_at": now_iso
    }
    await db["conversations"].insert_one(conv_doc)

    messages = [
        {
            "id": str(uuid.uuid4()),
            "uuid": str(uuid.uuid4()),
            "conversation_id": conv_id,
            "sender_user_id": lost_user_id,
            "receiver_user_id": found_user_id,
            "sender_name": "Alexander Pierce",
            "sender_role": "LOST_USER",
            "message_text": "Hello Sophia, I believe the Samsung phone you found at the Central Library is mine. It has a blue star sticker inside the clear case and a matte screen protector.",
            "sent_at": now_iso,
            "delivered_at": now_iso,
            "read_at": now_iso,
            "status": "SEEN",
            "created_at": now_iso
        },
        {
            "id": str(uuid.uuid4()),
            "uuid": str(uuid.uuid4()),
            "conversation_id": conv_id,
            "sender_user_id": found_user_id,
            "receiver_user_id": lost_user_id,
            "sender_name": "Sophia Bennett",
            "sender_role": "FOUND_USER",
            "message_text": "Hi Alexander! Yes, I verified the blue star sticker inside the clear case. It matches your description. I can meet you at the Central Library front desk today at 4:00 PM.",
            "sent_at": now_iso,
            "delivered_at": now_iso,
            "read_at": None,
            "status": "DELIVERED",
            "created_at": now_iso
        }
    ]
    for msg in messages:
        await db["conversation_messages"].insert_one(msg)

    # 7. Create In-App Notifications
    notifs = [
        {
            "id": str(uuid.uuid4()),
            "uuid": str(uuid.uuid4()),
            "user_id": lost_user_id,
            "type": "AI_MATCH",
            "title": "92% Potential Match Detected!",
            "message": "A potential match 'Black Samsung Smartphone' was reported found in Central Library.",
            "link": "/lost/matches",
            "status": "UNREAD",
            "created_at": now_iso
        },
        {
            "id": str(uuid.uuid4()),
            "uuid": str(uuid.uuid4()),
            "user_id": lost_user_id,
            "type": "NEW_MESSAGE",
            "title": "New Reply from Sophia Bennett",
            "message": "Sophia replied regarding your verification request for the Samsung Smartphone.",
            "link": f"/lost/messages/{conv_id}",
            "status": "UNREAD",
            "created_at": now_iso
        },
        {
            "id": str(uuid.uuid4()),
            "uuid": str(uuid.uuid4()),
            "user_id": found_user_id,
            "type": "VERIFICATION_REQUEST",
            "title": "New Verification Request Received",
            "message": "Alexander Pierce sent a verification request for 'Black Samsung Smartphone'.",
            "link": f"/found/messages/{conv_id}",
            "status": "READ",
            "created_at": now_iso,
            "read_at": now_iso
        }
    ]
    for n in notifs:
        await db["notifications"].insert_one(n)

    # 8. Create a Recovered Record for Analytics
    rec_id = "REC-DEMO-001"
    rec_doc = {
        "id": rec_id,
        "uuid": rec_id,
        "lost_report_id": "report-lost-001",
        "found_report_id": "report-found-001",
        "lost_user_id": lost_user_id,
        "found_user_id": found_user_id,
        "status": "RETURNED",
        "recovery_method": "SECURE_QR_HANDOVER",
        "created_at": now_iso,
        "verified_at": now_iso
    }
    await db["recovery_records"].insert_one(rec_doc)

    print("\n[OK] Seed Demo Data Successfully Loaded!")
    print("="*65)
    print("DEMO ACCOUNTS READY FOR EVALUATION:")
    print("   LOST USER LOGIN : lost.user@campus.edu  | Pass: LostPass123!")
    print("   FOUND USER LOGIN: found.user@campus.edu | Pass: FoundPass123!")
    print("   ADMIN LOGIN     : admin@campuslostfound.edu | Pass: AdminPass123!")
    print("="*65 + "\n")

if __name__ == "__main__":
    asyncio.run(seed_demo_data())
