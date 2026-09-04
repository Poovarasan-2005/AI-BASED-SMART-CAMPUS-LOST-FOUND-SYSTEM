import pytest
import io
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.database.db import get_database
from app.security.auth import create_access_token, hash_password
from PIL import Image

client = TestClient(app)

def test_notifications_lifecycle():
    user_id = "test-notif-user-1"
    
    async def setup_notif():
        db = await get_database()
        await db["users"].insert_one({
            "id": user_id, "uuid": user_id, "email": "notif.user@campus.edu",
            "full_name": "Notif User", "role": "LOST_USER",
            "password_hash": hash_password("Pass123!")
        })
        await db["notifications"].insert_one({
            "id": "notif-001", "uuid": "notif-001", "user_id": user_id,
            "type": "AI_MATCH", "title": "Potential Match", "message": "Test match notice",
            "link": "/lost/matches", "status": "UNREAD", "created_at": "2026-08-25T10:00:00"
        })

    asyncio.run(setup_notif())
    token = create_access_token(data={"sub": user_id, "email": "notif.user@campus.edu", "role": "LOST_USER"})

    # 1. Fetch notifications
    res = client.get("/api/notifications", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["unread_count"] >= 1
    assert any(n["uuid"] == "notif-001" for n in data["notifications"])

    # 2. Mark notification as read
    res_read = client.put("/api/notifications/notif-001/read", headers={"Authorization": f"Bearer {token}"})
    assert res_read.status_code == 200

    # 3. Verify unread count decreases
    res2 = client.get("/api/notifications", headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 200
    notif_target = [n for n in res2.json()["notifications"] if n["uuid"] == "notif-001"][0]
    assert notif_target["status"] == "READ"

def test_image_upload_security_validation():
    user_id = "test-upload-user"
    token = create_access_token(data={"sub": user_id, "email": "uploader@campus.edu", "role": "LOST_USER"})

    # 1. Reject invalid file extension (e.g. .exe / .sh)
    fake_exe = io.BytesIO(b"echo 'malicious'")
    res = client.post(
        "/api/ai/upload-image",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("malware.exe", fake_exe, "application/octet-stream")}
    )
    assert res.status_code == 400
    assert "Unsupported file extension" in res.json()["detail"]

    # 2. Accept valid PNG image
    img = Image.new("RGB", (100, 100), color="blue")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    img_bytes = img_byte_arr.getvalue()

    valid_file = io.BytesIO(img_bytes)
    res_ok = client.post(
        "/api/ai/upload-image",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("valid_item.png", valid_file, "image/png")}
    )
    assert res_ok.status_code == 200
    data = res_ok.json()
    assert data["success"] is True
    assert "image_url" in data
    assert data["image_url"].startswith("/uploads/")

def test_user_profile_and_change_password():
    user_id = "test-profile-user"
    
    async def setup_user():
        db = await get_database()
        await db["users"].insert_one({
            "id": user_id, "uuid": user_id, "email": "profile.user@campus.edu",
            "full_name": "Initial Name", "role": "LOST_USER",
            "mobile": "9998887770", "department": "Physics", "year": "2026",
            "password_hash": hash_password("OldPass123!")
        })
    asyncio.run(setup_user())
    token = create_access_token(data={"sub": user_id, "email": "profile.user@campus.edu", "role": "LOST_USER"})

    # Get Profile
    res = client.get("/api/user/profile", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["user"]["full_name"] == "Initial Name"

    # Update Profile
    res_up = client.put(
        "/api/user/profile",
        headers={"Authorization": f"Bearer {token}"},
        json={"full_name": "Updated Name", "mobile": "9998887771", "department": "Chemistry", "year": "4th Year"}
    )
    assert res_up.status_code == 200

    # Change Password
    res_pwd = client.post(
        "/api/user/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "OldPass123!", "new_password": "NewSecretPass456!"}
    )
    assert res_pwd.status_code == 200
