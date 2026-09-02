import pytest
import asyncio
from fastapi.testclient import TestClient
from app.main import app
from app.security.auth import hash_password, verify_password, create_access_token
from app.security.otp import generate_secure_otp, hash_otp, verify_otp_hash
from app.services.matching.multimodal_matcher import MultimodalMatcher
from app.services.matching.text_processor import TextProcessor

client = TestClient(app)

def test_password_hashing_security():
    pwd = "CampusUserPass123!"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_secure_otp_generation_and_hashing():
    otp1 = generate_secure_otp()
    assert len(otp1) == 6
    assert otp1.isdigit()
    
    hashed_otp = hash_otp(otp1)
    assert hashed_otp != otp1
    assert verify_otp_hash(otp1, hashed_otp) is True
    assert verify_otp_hash("000000", hashed_otp) is False

def test_multimodal_ai_matching_scoring():
    matcher = MultimodalMatcher()
    
    lost_rep = {
        "item_name": "Black Samsung Galaxy S24",
        "category": "Mobile Phone",
        "brand": "Samsung",
        "color": "Black",
        "serial_number": "SN987654321",
        "lost_location": "Library",
        "lost_date": "2026-08-25",
        "lost_time": "14:00",
        "description": "Black phone in clear case lost at library reading room.",
        "ai_features": {"color_vector": [0.1, 0.4, 0.5, 0.2]}
    }
    
    found_rep = {
        "item_name": "Black Samsung Phone",
        "category": "Mobile Phone",
        "brand": "Samsung",
        "color": "Black",
        "serial_number": "SN987654321",
        "found_location": "Library",
        "found_date": "2026-08-25",
        "found_time": "14:15",
        "description": "Found black Samsung smartphone near library entrance.",
        "ai_features": {"color_vector": [0.1, 0.4, 0.5, 0.2]}
    }
    
    result = matcher.compute_match_score(lost_rep, found_rep)
    assert result["overall_match_score"] >= 70
    assert result["ranking"] in ["MEDIUM", "HIGH", "VERY HIGH"]
    assert len(result["reasons"]) >= 3
    assert "✓ Same item category" in result["reasons"]

def test_natural_language_search_parser():
    parsed = TextProcessor.parse_natural_language_query("I lost my black backpack near the library yesterday")
    assert parsed["category"] == "Backpack"
    assert parsed["color"] == "Black"
    assert parsed["location"] == "Library"

def test_unauthenticated_api_rejection():
    res = client.get("/api/lost/reports")
    assert res.status_code in [401, 403]

def test_idor_and_role_protection():
    token_lost1 = create_access_token({"sub": "user-uuid-1", "role": "LOST_USER"})
    res = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {token_lost1}"})
    assert res.status_code in [401, 403]  # Access denied!
