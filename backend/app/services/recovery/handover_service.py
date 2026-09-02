import qrcode
import io
import base64
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any
from app.database.db import get_database

class HandoverService:
    @staticmethod
    def generate_qr_code_image(token: str) -> str:
        """
        Generates base64 encoded PNG image of QR code containing recovery token string.
        """
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(token)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        return f"data:image/png;base64,{img_str}"

    @classmethod
    async def create_recovery_record(cls, verification_request_id: str, lost_report_id: str, found_report_id: str, lost_user_id: str, found_user_id: str) -> Dict[str, Any]:
        """
        Creates recovery record with single-use temporary handover QR token.
        """
        db = await get_database()
        
        recovery_id = f"REC-2026-{uuid.uuid4().hex[:6].upper()}"
        qr_token = f"HANDOVER-{uuid.uuid4().hex}"
        qr_expires_at = (datetime.utcnow() + timedelta(hours=24)).isoformat()

        qr_image = cls.generate_qr_code_image(qr_token)

        recovery_record = {
            "id": str(uuid.uuid4()),
            "uuid": str(uuid.uuid4()),
            "recovery_id": recovery_id,
            "verification_request_id": verification_request_id,
            "lost_report_id": lost_report_id,
            "found_report_id": found_report_id,
            "lost_user_id": lost_user_id,
            "found_user_id": found_user_id,
            "ownership_verified": True,
            "qr_token": qr_token,
            "qr_image": qr_image,
            "qr_expires_at": qr_expires_at,
            "handover_completed": False,
            "recovery_date": None,
            "status": "READY_FOR_HANDOVER",
            "created_at": datetime.utcnow().isoformat()
        }

        await db["recovery_records"].insert_one(recovery_record)
        return recovery_record

    @classmethod
    async def generate_recovery_receipt(cls, recovery_record: Dict[str, Any], item_name: str) -> Dict[str, Any]:
        """
        Generates official Digital Recovery Receipt data.
        """
        return {
            "title": "Campus Lost & Found Recovery Receipt",
            "recovery_id": recovery_record.get("recovery_id"),
            "item_name": item_name,
            "verification_status": "Successful (OTP & Secret Attribute Verified)",
            "handover_status": "Completed",
            "date": recovery_record.get("recovery_date") or datetime.utcnow().isoformat(),
            "final_status": "RECOVERED",
            "issued_by": "Smart Campus Lost & Found System Authority"
        }
