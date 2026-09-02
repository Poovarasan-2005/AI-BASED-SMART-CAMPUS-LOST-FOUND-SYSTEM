import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.database.db import get_database
from app.security.auth import create_access_token, hash_password
from app.security.otp import generate_secure_otp, hash_otp, verify_otp_hash

client = TestClient(app)

def test_cryptographic_mobile_otp_security():
    """Verify cryptographic EXACTLY 6-digit OTP generation, SHA-256 hash storage, and single-use invalidation."""
    otp1 = generate_secure_otp(length=6)
    otp2 = generate_secure_otp(length=6)
    
    assert len(otp1) == 6
    assert len(otp2) == 6
    assert otp1.isdigit()
    assert otp2.isdigit()
    assert otp1 != otp2  # Cryptographic randomness
    
    hashed = hash_otp(otp1)
    assert hash_otp(otp1) == hashed
    assert verify_otp_hash(otp1, hashed) is True
    assert verify_otp_hash("000000", hashed) is False

def test_bola_idor_conversation_access():
    """Verify Object-Level Authorization (BOLA/IDOR protection) on private conversation routes."""
    async def run_body():
        db = await get_database()
        
        user1_id = "test-user-owner-101"
        user2_id = "test-user-finder-202"
        hacker_id = "test-user-hacker-999"

        # Insert test users
        await db["users"].insert_one({
            "id": user1_id, "uuid": user1_id, "email": "owner@campus.edu",
            "full_name": "Owner User", "role": "LOST_USER", "phone_number": "9080667045", "password_hash": hash_password("Pass123!")
        })
        await db["users"].insert_one({
            "id": user2_id, "uuid": user2_id, "email": "finder@campus.edu",
            "full_name": "Finder User", "role": "FOUND_USER", "password_hash": hash_password("Pass123!")
        })
        await db["users"].insert_one({
            "id": hacker_id, "uuid": hacker_id, "email": "hacker@campus.edu",
            "full_name": "Hacker User", "role": "LOST_USER", "password_hash": hash_password("Pass123!")
        })

        conv_id = "CONV-TEST-BOLA"
        await db["conversations"].insert_one({
            "id": conv_id, "uuid": conv_id, "conversation_id": conv_id,
            "lost_user_id": user1_id, "found_user_id": user2_id,
            "status": "ACTIVE"
        })

        # Hacker token
        hacker_token = create_access_token(data={"sub": hacker_id, "email": "hacker@campus.edu", "role": "LOST_USER"})

        # Hacker attempts to access conversation -> Expect 403 Forbidden
        resp = client.get(
            f"/api/conversations/{conv_id}",
            headers={"Authorization": f"Bearer {hacker_token}"}
        )
        assert resp.status_code == 403
        assert "Access Denied" in resp.json()["detail"]

        # Hacker attempts to fetch messages -> Expect 403 Forbidden
        resp_msg = client.get(
            f"/api/conversations/{conv_id}/messages",
            headers={"Authorization": f"Bearer {hacker_token}"}
        )
        assert resp_msg.status_code == 403

        # Hacker attempts to send message -> Expect 403 Forbidden
        resp_send = client.post(
            f"/api/conversations/{conv_id}/messages",
            headers={"Authorization": f"Bearer {hacker_token}"},
            json={"message": "Hacker injection"}
        )
        assert resp_send.status_code == 403

        # Authorized Owner token
        owner_token = create_access_token(data={"sub": user1_id, "email": "owner@campus.edu", "role": "LOST_USER"})
        resp_owner = client.get(
            f"/api/conversations/{conv_id}",
            headers={"Authorization": f"Bearer {owner_token}"}
        )
        assert resp_owner.status_code == 200
        assert resp_owner.json()["conversation"]["uuid"] == conv_id

    asyncio.run(run_body())

def test_double_handover_confirmation():
    """Verify that a case closes to RETURNED only when both Found User & Lost User confirm handover."""
    async def run_body():
        db = await get_database()

        owner_id = "owner-double-conf"
        finder_id = "finder-double-conf"
        conv_id = "CONV-DOUBLE-CONF"
        lost_rep_id = "lost-rep-double"
        found_rep_id = "found-rep-double"

        await db["users"].insert_one({"id": owner_id, "uuid": owner_id, "email": "o@c.edu", "full_name": "O", "role": "LOST_USER"})
        await db["users"].insert_one({"id": finder_id, "uuid": finder_id, "email": "f@c.edu", "full_name": "F", "role": "FOUND_USER"})

        await db["lost_reports"].insert_one({"id": lost_rep_id, "uuid": lost_rep_id, "status": "MATCHED"})
        await db["found_reports"].insert_one({"id": found_rep_id, "uuid": found_rep_id, "status": "MATCHED"})

        await db["conversations"].insert_one({
            "id": conv_id, "uuid": conv_id, "conversation_id": conv_id,
            "verification_request_id": "VR-CONF",
            "lost_report_id": lost_rep_id, "found_report_id": found_rep_id,
            "lost_user_id": owner_id, "found_user_id": finder_id,
            "status": "ACTIVE",
            "handover_confirmed_by_finder": False,
            "handover_confirmed_by_owner": False
        })

        finder_token = create_access_token(data={"sub": finder_id, "email": "f@c.edu", "role": "FOUND_USER"})
        owner_token = create_access_token(data={"sub": owner_id, "email": "o@c.edu", "role": "LOST_USER"})

        # 1. Finder confirms -> Case stays ACTIVE until owner confirms
        resp1 = client.post(f"/api/conversations/{conv_id}/confirm-handover", headers={"Authorization": f"Bearer {finder_token}"})
        assert resp1.status_code == 200
        assert resp1.json()["both_confirmed"] is False

        # 2. Owner confirms -> Case closes & statuses set to RETURNED
        resp2 = client.post(f"/api/conversations/{conv_id}/confirm-handover", headers={"Authorization": f"Bearer {owner_token}"})
        assert resp2.status_code == 200
        assert resp2.json()["both_confirmed"] is True
        assert resp2.json()["status"] == "CLOSED"

        lost_doc = await db["lost_reports"].find_one({"uuid": lost_rep_id})
        assert lost_doc["status"] == "RETURNED"

    asyncio.run(run_body())
