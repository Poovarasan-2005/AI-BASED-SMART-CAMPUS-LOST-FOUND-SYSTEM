import asyncio
import os
import sys
import uuid
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend"))

from app.database.db import get_database
from app.security.auth import hash_password

async def seed_demo_data():
    """
    Seeds the database with sample Lost User, Found User, Admin, reports, and verification requests.
    """
    db = await get_database()
    print("Seeding Smart Campus Lost & Found System Demo Data...")

    # Clear existing demo collections for clean demonstration
    for col in ["users", "lost_reports", "found_reports", "verification_requests", "recovery_records", "notifications", "security_audit_logs"]:
        if hasattr(db[col], "data"):
            db[col].data.clear()

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
        "account_status": "ACTIVE",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
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
        "account_status": "ACTIVE",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    await db["users"].insert_one(found_user)

    # 3. Create Admin User
    admin_user_id = "user-admin-001"
    admin_user = {
        "id": admin_user_id,
        "uuid": admin_user_id,
        "full_name": "System Administrator",
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
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    await db["users"].insert_one(admin_user)

    # 3. Create Lost Item Report
    lost_report_id = "report-lost-001"
    lost_report = {
        "id": lost_report_id,
        "uuid": lost_report_id,
        "user_id": lost_user_id,
        "item_name": "Black Samsung Galaxy S24 Ultra",
        "category": "Mobile Phone",
        "description": "Black Samsung S24 phone with a clear protective cover lost in Central Library reading room.",
        "brand": "Samsung",
        "model": "Galaxy S24 Ultra",
        "color": "Black",
        "serial_number": "S24-ULTRA-88392",
        "lost_date": "2026-08-25",
        "lost_time": "13:30",
        "lost_location": "Library",
        "image_url": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop",
        "secret_attribute": "Small blue star sticker inside the clear phone case",
        "ai_features": {"dominant_color": "Black", "color_vector": [0.1, 0.4, 0.5, 0.2]},
        "status": "ACTIVE",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    await db["lost_reports"].insert_one(lost_report)

    # 4. Create Found Item Report
    found_report_id = "report-found-001"
    found_report = {
        "id": found_report_id,
        "uuid": found_report_id,
        "user_id": found_user_id,
        "item_name": "Black Samsung Smartphone",
        "category": "Mobile Phone",
        "description": "Found a black Samsung smartphone lying on the 2nd floor desk near Central Library.",
        "brand": "Samsung",
        "model": "Galaxy S24",
        "color": "Black",
        "serial_number": "S24-ULTRA-88392",
        "found_date": "2026-08-25",
        "found_time": "13:45",
        "found_location": "Library",
        "image_url": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop",
        "ai_features": {"dominant_color": "Black", "color_vector": [0.1, 0.4, 0.5, 0.2]},
        "status": "ACTIVE",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    await db["found_reports"].insert_one(found_report)

    print("\n[OK] Seed Demo Data Successfully Loaded!")
    print("="*65)
    print("DEMO ACCOUNTS READY FOR EVALUATION:")
    print("   LOST USER LOGIN : lost.user@campus.edu  | Pass: LostPass123!")
    print("   FOUND USER LOGIN: found.user@campus.edu | Pass: FoundPass123!")
    print("   ADMIN LOGIN     : admin@campuslostfound.edu | Pass: AdminPass123!")
    print("="*65 + "\n")

if __name__ == "__main__":
    asyncio.run(seed_demo_data())
