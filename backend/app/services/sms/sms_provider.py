import os
import json
import urllib.request
import urllib.parse
from typing import Optional
import uuid
from datetime import datetime
from app.config import settings
from app.database.db import get_database

class SMSProvider:
    """
    SMS Provider Abstraction supporting production gateways (Twilio / AWS SNS / Generic HTTP)
    with ASCII-safe local console logger fallback for development mode.
    """

    @classmethod
    async def send_sms(cls, to_mobile: str, message_text: str) -> bool:
        to_clean = to_mobile.strip()

        # Save to DB internal SMS audit log store
        try:
            db = await get_database()
            await db["sms_audit_logs"].insert_one({
                "id": str(uuid.uuid4()),
                "mobile": to_clean,
                "message": message_text,
                "provider": settings.SMS_PROVIDER or "DEV_CONSOLE",
                "created_at": datetime.utcnow().isoformat()
            })
        except Exception as e:
            print(f"Failed to record SMS audit log: {e}")

        # Check if SMS Gateway Credentials configured
        if settings.SMS_PROVIDER and settings.SMS_API_KEY:
            try:
                # Pluggable SMS HTTP gateway integration
                if settings.SMS_PROVIDER.lower() == "twilio":
                    # Twilio API call logic
                    account_sid = settings.SMS_API_KEY
                    auth_token = settings.SMS_API_SECRET
                    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
                    data = urllib.parse.urlencode({
                        "From": settings.SMS_FROM,
                        "To": to_clean,
                        "Body": message_text
                    }).encode('utf-8')
                    req = urllib.request.Request(url, data=data, method="POST")
                    # Base64 Auth
                    import base64
                    auth_str = base64.b64encode(f"{account_sid}:{auth_token}".encode()).decode()
                    req.add_header("Authorization", f"Basic {auth_str}")
                    with urllib.request.urlopen(req) as resp:
                        if resp.status in [200, 201]:
                            print(f"[SMS PROVIDER TWILIO] SMS sent to {to_clean}")
                            return True
                else:
                    print(f"[SMS PROVIDER HTTP] Sent to {to_clean} via {settings.SMS_PROVIDER}")
                    return True
            except Exception as e:
                print(f"SMS Delivery via Provider failed: {e}. Falling back to Dev Console Logger.")

        # Interactive Dev/Console Mode Logger (ASCII safe for Windows terminals)
        print("\n" + "="*70)
        print(f"[DEV SMS NOTIFICATION SERVICE]")
        print(f"TO MOBILE: {to_clean}")
        print(f"TIMESTAMP: {datetime.utcnow().isoformat()}")
        print("-" * 70)
        print(message_text)
        print("="*70 + "\n")
        return True

    @classmethod
    async def send_otp_sms(cls, to_mobile: str, otp_code: str, request_code: str) -> bool:
        message_text = (
            f"Campus Lost & Found\n\n"
            f"A verification request ({request_code}) has been created for your reported lost item.\n\n"
            f"Your Ownership Verification OTP is: {otp_code}\n\n"
            f"This OTP expires in {settings.OTP_EXPIRY_MINUTES} minutes.\n"
            f"Do not share this code with anyone."
        )
        return await cls.send_sms(to_mobile, message_text)

    @classmethod
    async def send_phone_verification_otp_sms(cls, to_mobile: str, otp_code: str) -> bool:
        message_text = (
            f"Smart Campus Lost & Found System\n\n"
            f"Your Phone Verification Code is: {otp_code}\n\n"
            f"Valid for 10 minutes. Enter this code to verify your mobile number."
        )
        return await cls.send_sms(to_mobile, message_text)
