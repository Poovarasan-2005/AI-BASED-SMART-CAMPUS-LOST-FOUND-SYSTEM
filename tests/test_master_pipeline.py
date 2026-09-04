import sys
import json
import urllib.request
import urllib.error

# Ensure utf-8 output on Windows console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_URL = "http://localhost:8000/api"

def make_request(method, endpoint, data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    encoded_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_content = e.read().decode("utf-8")
        try:
            parsed = json.loads(err_content)
        except Exception:
            parsed = {"detail": err_content}
        return e.code, parsed

def run_master_pipeline_test():
    print("=" * 65)
    print("STARTING END-TO-END MASTER WORKFLOW VERIFICATION")
    print("LOST -> REPORT -> AI MATCH -> VERIFY -> COMMUNICATE -> RECOVER")
    print("=" * 65)

    # 1. Lost User Login
    status, lost_auth = make_request("POST", "/lost/login", {
        "email": "lost.user@campus.edu",
        "password": "LostPass123!"
    })
    assert status == 200, f"Lost user login failed: {lost_auth}"
    lost_token = lost_auth["access_token"]
    print("[STEP 1 PASSED] Lost User authenticated:", lost_auth["user"]["full_name"])

    # 2. Found User Login
    status, found_auth = make_request("POST", "/found/login", {
        "email": "found.user@campus.edu",
        "password": "FoundPass123!"
    })
    assert status == 200, f"Found user login failed: {found_auth}"
    found_token = found_auth["access_token"]
    print("[STEP 2 PASSED] Found User authenticated:", found_auth["user"]["full_name"])

    # 3. Lost User reports a lost item with 12 fields
    lost_item_data = {
        "item_name": "Titanium Gray Samsung Galaxy S24 Ultra",
        "category": "Mobile Phone",
        "description": "Lost my gray Samsung Galaxy S24 Ultra with an anime sticker on the case near the 2nd floor library reading room.",
        "brand": "Samsung",
        "model": "Galaxy S24 Ultra",
        "color": "Titanium Gray",
        "unique_features": "Holographic anime sticker on clear case, tiny scratch on bottom left corner",
        "lost_date": "2026-09-03",
        "lost_time": "14:30",
        "lost_location": "Central Library, 2nd Floor Reading Room",
        "image_url": "/uploads/samsung_s24.jpg",
        "additional_info": "High sentimental value, contains study materials for finals.",
        "secret_attribute": "Wallpaper is a nebula with lock PIN ending in 42"
    }
    status, lost_report = make_request("POST", "/lost/reports", lost_item_data, lost_token)
    assert status in (200, 201), f"Lost report creation failed: {lost_report}"
    lost_doc = lost_report.get("report", lost_report)
    lost_uuid = lost_doc["uuid"]
    print(f"[STEP 3 PASSED] Lost Item reported: {lost_uuid} ({lost_doc['item_name']})")

    # 4. Found User reports a matching found item with 12 fields
    found_item_data = {
        "item_name": "Samsung Galaxy S24 Phone with Case",
        "category": "Mobile Phone",
        "description": "Discovered a modern gray Samsung smartphone left behind on desk #14 at the library reading room.",
        "brand": "Samsung",
        "model": "S24 Ultra",
        "color": "Gray / Titanium",
        "unique_features": "Clear case with a colorful character sticker on back",
        "found_date": "2026-09-03",
        "found_time": "15:00",
        "found_location": "Central Library Desk 14",
        "image_url": "/uploads/samsung_s24.jpg",
        "additional_info": "Handed over to librarian desk temporarily."
    }
    status, found_report = make_request("POST", "/found/reports", found_item_data, found_token)
    assert status in (200, 201), f"Found report creation failed: {found_report}"
    found_doc = found_report.get("report", found_report)
    found_uuid = found_doc["uuid"]
    print(f"[STEP 4 PASSED] Found Item reported: {found_uuid} ({found_doc['item_name']})")

    # 5. Multimodal AI Matching Engine executes matching
    status, ai_result = make_request("POST", "/ai/match", {
        "report_id": lost_uuid,
        "report_type": "LOST"
    }, lost_token)
    assert status == 200, f"AI matching failed: {ai_result}"
    matches = ai_result.get("matches", [])
    assert len(matches) > 0, "No AI matches generated!"
    top_match = matches[0]
    print(f"[STEP 5 PASSED] AI Matching Engine evaluated {len(matches)} match(es).")
    print(f"               Top Match Score: {top_match['overall_match_score']}% ({top_match['label']})")
    print(f"               Matching Factors:")
    for factor in top_match.get("reasons", []):
        print(f"                 • {factor}")

    # Verify requirement: label must say "POTENTIAL MATCH", never "CONFIRMED MATCH"
    assert "POTENTIAL MATCH" in top_match["label"].upper(), "AI label must designate POTENTIAL MATCH!"
    assert "CONFIRMED MATCH" not in top_match["label"].upper(), "AI label must NEVER say CONFIRMED MATCH!"

    # 6. Lost User sends Verification Request to Finder
    vr_payload = {
        "found_report_id": found_uuid,
        "lost_report_id": lost_uuid,
        "requester_name": "Alexander Pierce",
        "requester_email": "lost.user@campus.edu",
        "requester_mobile": "+19876543210",
        "description": "Hi, I believe this is my phone! The back case has a holographic anime sticker and the PIN ends in 42."
    }
    status, vr_res = make_request("POST", "/verification/send-request", vr_payload, lost_token)
    assert status in (200, 201), f"Verification request failed: {vr_res}"
    vr_id = vr_res["verification_request_id"]
    conv_id = vr_res["conversation_id"]
    print(f"[STEP 6 PASSED] Verification Request sent: ID {vr_id}, Conversation ID {conv_id}")

    # 7. Found User opens conversation -> Status triggers DELIVERED and SEEN
    status, conv_msgs = make_request("GET", f"/conversations/{conv_id}/messages", None, found_token)
    assert status == 200, f"Failed to retrieve conversation messages: {conv_msgs}"
    messages = conv_msgs.get("messages", [])
    assert len(messages) >= 1, "Expected initial verification request message in conversation"
    initial_msg = messages[0]
    print(f"[STEP 7 PASSED] Found User opened conversation. Message status: {initial_msg.get('status')}")
    assert initial_msg.get("read_at") is not None or initial_msg.get("status") in ("SEEN", "READ"), "Message should be marked SEEN upon viewing"

    # 8. Found User replies to the conversation
    status, reply_res = make_request("POST", f"/conversations/{conv_id}/messages", {
        "message": "Hi Alexander! Yes, the sticker matches. Let's meet at the Central Library reception desk today at 4 PM."
    }, found_token)
    assert status == 200, f"Failed to send reply: {reply_res}"
    print(f"[STEP 8 PASSED] Found User replied: \"{reply_res.get('message')}\"")

    # 9. Lost User checks In-App Notifications
    status, notif_res = make_request("GET", "/notifications", None, lost_token)
    assert status == 200, f"Failed to fetch notifications: {notif_res}"
    print(f"[STEP 9 PASSED] Lost User notification inbox retrieved ({notif_res.get('unread_count')} unread).")

    # 10. Recovery Flow: Approve verification and generate QR Code handover record
    status, apprv_res = make_request("POST", f"/lost/verification-requests/{vr_id}/approve", None, lost_token)
    assert status == 200, f"Failed to approve verification request: {apprv_res}"
    recovery_rec = apprv_res.get("recovery_record", {})
    recovery_id = recovery_rec.get("recovery_id") or vr_id
    qr_token = recovery_rec.get("qr_token")
    print(f"[STEP 10 PASSED] Verification Approved. Handover Recovery ID: {recovery_id}")

    # 11. Finder scans and validates QR Code
    if qr_token:
        status, qr_val = make_request("POST", f"/recovery/{recovery_id}/verify-qr", {"qr_token": qr_token}, found_token)
        assert status == 200, f"QR verification failed: {qr_val}"
        print(f"[STEP 11 PASSED] Finder validated QR Code Token: {qr_val.get('message')}")

    # 12. Complete Handover & Close Case
    status, finish_res = make_request("POST", f"/recovery/{recovery_id}/complete", None, found_token)
    assert status == 200, f"Failed to complete handover: {finish_res}"
    receipt = finish_res.get("receipt", {})
    print(f"[STEP 12 PASSED] Item Handover Completed! Receipt ID: {receipt.get('recovery_id')}, Status: {receipt.get('final_status')}")

    # 13. Admin Portal Verification
    status, admin_auth = make_request("POST", "/admin/login", {
        "email": "admin@campuslostfound.edu",
        "password": "AdminPass123!"
    })
    assert status == 200, f"Admin login failed: {admin_auth}"
    admin_token = admin_auth["access_token"]
    print(f"[STEP 13 PASSED] Admin authenticated successfully.")

    status, admin_dash = make_request("GET", "/admin/dashboard", None, admin_token)
    assert status == 200, f"Failed to fetch admin dashboard: {admin_dash}"
    metrics = admin_dash.get("metrics", {})
    print(f"                Metrics: Users={metrics.get('total_users')}, Lost={metrics.get('total_lost')}, Found={metrics.get('total_found')}, Recovered={metrics.get('total_recovered')}")

    status, audit_logs = make_request("GET", "/admin/audit-logs", None, admin_token)
    assert status == 200, f"Failed to fetch audit logs: {audit_logs}"
    print(f"                Audit Logs recorded: {len(audit_logs.get('audit_logs', []))}")

    print("=" * 65)
    print("ALL 13 END-TO-END MASTER PIPELINE VERIFICATIONS PASSED!")
    print("LOST -> REPORT -> AI MATCH -> VERIFY -> COMMUNICATE -> RECOVER")
    print("=" * 65)

if __name__ == "__main__":
    run_master_pipeline_test()
