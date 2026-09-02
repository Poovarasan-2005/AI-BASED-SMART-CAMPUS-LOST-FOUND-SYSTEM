import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.database.db import get_database
from app.security.auth import create_access_token, hash_password

client = TestClient(app)

def test_send_direct_verification_request_workflow():
    """
    Verify complete workflow:
    1. Found User posts found item.
    2. Lost User submits verification request with Name, Email, Mobile, Description.
    3. Backend sends email notification to Found User.
    4. Creates VerificationRequest (status: DELIVERED) and binds Conversation (status: ACTIVE).
    """
    finder_id = "test-finder-user-101"
    lost_id = "test-lost-user-202"
    found_report_id = "test-found-rep-303"

    async def setup_data():
        db = await get_database()
        await db["users"].insert_one({
            "id": finder_id, "uuid": finder_id, "email": "finder.person@campus.edu",
            "full_name": "Finder Person", "role": "FOUND_USER", "phone_number": "9876543210",
            "password_hash": hash_password("Pass123!")
        })
        await db["users"].insert_one({
            "id": lost_id, "uuid": lost_id, "email": "lost.person@campus.edu",
            "full_name": "Lost Person", "role": "LOST_USER", "phone_number": "9080667045",
            "password_hash": hash_password("Pass123!")
        })
        await db["found_reports"].insert_one({
            "id": found_report_id, "uuid": found_report_id,
            "user_id": finder_id,
            "item_name": "Blue Scientific Calculator",
            "category": "Electronics",
            "found_location": "Main Library Floor 2",
            "status": "ACTIVE"
        })

    asyncio.run(setup_data())

    # Lost user auth token
    lost_token = create_access_token(data={"sub": lost_id, "email": "lost.person@campus.edu", "role": "LOST_USER"})

    # Submit verification request
    resp = client.post(
        "/api/verification/send-request",
        headers={"Authorization": f"Bearer {lost_token}"},
        json={
            "found_report_id": found_report_id,
            "requester_name": "Lost Person",
            "requester_email": "lost.person@campus.edu",
            "requester_mobile": "9080667045",
            "description": "I lost my Casio fx-991EX calculator near desk 14 with a green sticker on the back."
        }
    )

    assert resp.status_code == 201
    data = resp.json()
    assert data["message"] == "Verification request sent successfully."
    assert "verification_request_id" in data
    assert "conversation_id" in data

    conv_id = data["conversation_id"]
    vr_id = data["verification_request_id"]

    async def verify_db():
        db = await get_database()
        # Verify DB VerificationRequest
        vr = await db["verification_requests"].find_one({"uuid": vr_id})
        assert vr is not None
        assert vr["requester_user_id"] == lost_id
        assert vr["recipient_user_id"] == finder_id
        assert vr["status"] == "DELIVERED"
        assert vr["requester_name"] == "Lost Person"
        assert vr["requester_email"] == "lost.person@campus.edu"
        assert vr["requester_mobile"] == "9080667045"

        # Verify DB Conversation
        conv = await db["conversations"].find_one({"uuid": conv_id})
        assert conv is not None
        assert conv["status"] == "ACTIVE"
        assert conv["verification_request_id"] == vr_id

        # Verify Initial Message
        msgs = await db["conversation_messages"].find({"conversation_id": conv_id}).to_list(10)
        assert len(msgs) >= 1
        found_msg = [m for m in msgs if m.get("sender_user_id") == lost_id][0]
        assert found_msg["status"] == "DELIVERED"
        assert found_msg["read_at"] is None
        assert found_msg["receiver_user_id"] == finder_id

    asyncio.run(verify_db())

def test_message_read_and_seen_status_transition():
    """
    Verify Sent -> Delivered -> Seen status progression:
    When the recipient fetches messages, status updates to SEEN and read_at timestamp is set.
    """
    finder_id = "test-finder-seen-101"
    lost_id = "test-lost-seen-202"
    conv_id = "CONV-TEST-SEEN-01"
    msg_id = "msg-seen-test-01"

    async def setup_data():
        db = await get_database()
        await db["users"].insert_one({
            "id": finder_id, "uuid": finder_id, "email": "finder.seen@campus.edu",
            "full_name": "Finder Seen", "role": "FOUND_USER"
        })
        await db["users"].insert_one({
            "id": lost_id, "uuid": lost_id, "email": "lost.seen@campus.edu",
            "full_name": "Lost Seen", "role": "LOST_USER"
        })
        await db["conversations"].insert_one({
            "id": conv_id, "uuid": conv_id, "conversation_id": conv_id,
            "verification_request_id": "VR-SEEN-01",
            "requester_user_id": lost_id,
            "recipient_user_id": finder_id,
            "lost_user_id": lost_id,
            "found_user_id": finder_id,
            "status": "ACTIVE"
        })
        await db["verification_requests"].insert_one({
            "id": "VR-SEEN-01", "uuid": "VR-SEEN-01", "request_code": "VR-SEEN-01",
            "requester_user_id": lost_id, "recipient_user_id": finder_id,
            "status": "DELIVERED"
        })
        await db["conversation_messages"].insert_one({
            "id": msg_id, "uuid": msg_id,
            "conversation_id": conv_id,
            "sender_user_id": lost_id,
            "receiver_user_id": finder_id,
            "sender_name": "Lost Seen",
            "sender_role": "LOST_USER",
            "message_text": "Hello, is this still available?",
            "sent_at": "2026-08-26T12:00:00",
            "delivered_at": "2026-08-26T12:00:01",
            "read_at": None,
            "status": "DELIVERED"
        })

    asyncio.run(setup_data())

    # 1. Lost user checks messages -> should NOT mark as SEEN (lost user is sender, not receiver)
    lost_token = create_access_token(data={"sub": lost_id, "email": "lost.seen@campus.edu", "role": "LOST_USER"})
    resp_lost = client.get(f"/api/conversations/{conv_id}/messages", headers={"Authorization": f"Bearer {lost_token}"})
    assert resp_lost.status_code == 200
    msg_lost_view = resp_lost.json()["messages"][0]
    assert msg_lost_view["status"] == "DELIVERED"
    assert msg_lost_view["read_at"] is None

    # 2. Finder opens the conversation -> MUST mark as SEEN and set read_at
    finder_token = create_access_token(data={"sub": finder_id, "email": "finder.seen@campus.edu", "role": "FOUND_USER"})
    resp_finder = client.get(f"/api/conversations/{conv_id}/messages", headers={"Authorization": f"Bearer {finder_token}"})
    assert resp_finder.status_code == 200
    msg_finder_view = resp_finder.json()["messages"][0]
    assert msg_finder_view["status"] == "SEEN"
    assert msg_finder_view["read_at"] is not None

    async def verify_db():
        db = await get_database()
        db_msg = await db["conversation_messages"].find_one({"uuid": msg_id})
        assert db_msg["status"] == "SEEN"
        assert db_msg["read_at"] is not None

        db_vr = await db["verification_requests"].find_one({"uuid": "VR-SEEN-01"})
        assert db_vr["status"] == "SEEN"

    asyncio.run(verify_db())

def test_bidirectional_conversation_reply():
    """
    Verify bidirectional messaging and email reply notification flow.
    """
    finder_id = "test-finder-reply-101"
    lost_id = "test-lost-reply-202"
    conv_id = "CONV-TEST-REPLY-01"

    async def setup_data():
        db = await get_database()
        await db["users"].insert_one({
            "id": finder_id, "uuid": finder_id, "email": "finder.reply@campus.edu",
            "full_name": "Finder Reply", "role": "FOUND_USER"
        })
        await db["users"].insert_one({
            "id": lost_id, "uuid": lost_id, "email": "lost.reply@campus.edu",
            "full_name": "Lost Reply", "role": "LOST_USER"
        })
        await db["conversations"].insert_one({
            "id": conv_id, "uuid": conv_id, "conversation_id": conv_id,
            "verification_request_id": "VR-REPLY-01",
            "requester_user_id": lost_id,
            "recipient_user_id": finder_id,
            "lost_user_id": lost_id,
            "found_user_id": finder_id,
            "status": "ACTIVE"
        })

    asyncio.run(setup_data())

    finder_token = create_access_token(data={"sub": finder_id, "email": "finder.reply@campus.edu", "role": "FOUND_USER"})

    # Finder sends reply
    resp = client.post(
        f"/api/conversations/{conv_id}/messages",
        headers={"Authorization": f"Bearer {finder_token}"},
        json={"message": "Yes, I have your calculator with the green sticker! Let's meet at Security Office."}
    )
    assert resp.status_code == 200
    msg_doc = resp.json()["message_doc"]
    assert msg_doc["status"] == "DELIVERED"
    assert msg_doc["read_at"] is None
    assert msg_doc["sender_user_id"] == finder_id
    assert msg_doc["receiver_user_id"] == lost_id
