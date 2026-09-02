import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import uuid
from datetime import datetime
from app.config import settings
from app.database.db import get_database

class EmailService:
    @staticmethod
    async def send_email(to_email: str, subject: str, body_text: str, body_html: Optional[str] = None):
        """
        Sends email using SMTP if configured, or logs formatted message to console & DB notifications.
        """
        # Save in DB notification store
        try:
            db = await get_database()
            # Find user by email
            user = await db["users"].find_one({"email": to_email})
            user_id = user["uuid"] if user else "SYSTEM"
            
            await db["notifications"].insert_one({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "email": to_email,
                "title": subject,
                "message": body_text,
                "is_read": False,
                "created_at": datetime.utcnow().isoformat()
            })
        except Exception as e:
            print(f"Failed to record internal notification: {e}")

        # Check SMTP configuration
        if settings.EMAIL_HOST and settings.EMAIL_USERNAME and settings.EMAIL_PASSWORD:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = settings.EMAIL_FROM
                msg["To"] = to_email
                
                part1 = MIMEText(body_text, "plain")
                msg.attach(part1)
                
                if body_html:
                    part2 = MIMEText(body_html, "html")
                    msg.attach(part2)
                    
                with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as server:
                    server.starttls()
                    server.login(settings.EMAIL_USERNAME, settings.EMAIL_PASSWORD)
                    server.sendmail(settings.EMAIL_FROM, to_email, msg.as_string())
                print(f"SMTP Email sent successfully to {to_email}")
                return True
            except Exception as e:
                print(f"SMTP Email Delivery Failed: {e}. Falling back to Console/Dev logger.")

        # Interactive Dev/Console Mode Logger (ASCII safe for Windows terminals)
        print("\n" + "="*70)
        print(f"[DEV EMAIL NOTIFICATION SERVICE]")
        print(f"TO: {to_email}")
        print(f"SUBJECT: {subject}")
        print(f"TIMESTAMP: {datetime.utcnow().isoformat()}")
        print("-" * 70)
        print(body_text)
        print("="*70 + "\n")
        return True

    @classmethod
    async def send_verification_email(cls, to_email: str, token: str, user_role: str):
        subject = "Smart Campus Lost & Found - Email Verification"
        verify_url = f"http://localhost:5173/email-verification?token={token}&role={user_role.lower()}"
        body_text = (
            f"Welcome to Smart Campus Lost & Found System!\n\n"
            f"Please verify your email address by opening the following link:\n"
            f"{verify_url}\n\n"
            f"This link will expire in {settings.VERIFICATION_TOKEN_EXPIRY} minutes.\n"
            f"If you did not create an account, please ignore this email."
        )
        return await cls.send_email(to_email, subject, body_text)

    @classmethod
    async def send_otp_email(cls, to_email: str, otp_code: str, request_id: str):
        subject = "Lost & Found Ownership Verification OTP"
        body_text = (
            f"Smart Campus Lost & Found System - Ownership Verification\n\n"
            f"Your one-time verification OTP is:\n\n"
            f"   >>> {otp_code} <<<\n\n"
            f"Verification Request ID: {request_id}\n"
            f"Valid for: {settings.OTP_EXPIRY_MINUTES} minutes.\n"
            f"Maximum attempts: {settings.OTP_MAX_ATTEMPTS}.\n\n"
            f"CRITICAL SECURITY WARNING: Do not share this OTP with anyone, including the Found user or campus staff."
        )
        return await cls.send_email(to_email, subject, body_text)

    @classmethod
    async def send_direct_verification_request_email(
        cls,
        to_email: str,
        requester_name: str,
        requester_email: str,
        requester_mobile: str,
        description: str,
        item_name: str,
        conversation_id: str,
        request_code: str
    ):
        """
        Sends complete verification request directly to the email of the person who reported the item/person as found.
        """
        subject = "New Verification Request – Smart Campus Lost & Found"
        conv_url = f"http://localhost:5173/found/conversations/{conversation_id}"
        req_timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

        body_text = (
            f"Hello,\n\n"
            f"You have received a new Verification Request regarding your reported found item/person: '{item_name}'.\n\n"
            f"==================================================\n"
            f"VERIFICATION REQUEST DETAILS\n"
            f"==================================================\n"
            f"Verification Reference: {request_code}\n"
            f"Date & Time: {req_timestamp}\n\n"
            f"Requester Name  : {requester_name}\n"
            f"Requester Email : {requester_email}\n"
            f"Requester Mobile: {requester_mobile}\n\n"
            f"Message / Description:\n"
            f"{description}\n"
            f"==================================================\n\n"
            f"To open the authenticated verification conversation and reply, click the link below:\n"
            f"[ Open Secure Conversation ]: {conv_url}\n\n"
            f"Note: This conversation is private and accessible only to authorized participants."
        )

        body_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 8px;">
          <h2 style="color: #38bdf8; margin-top: 0;">New Verification Request</h2>
          <p>You have received a new verification request regarding your reported found record: <strong>{item_name}</strong>.</p>
          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Reference:</strong> {request_code}</p>
            <p style="margin: 4px 0;"><strong>Date & Time:</strong> {req_timestamp}</p>
            <p style="margin: 4px 0;"><strong>Requester Name:</strong> {requester_name}</p>
            <p style="margin: 4px 0;"><strong>Requester Email:</strong> {requester_email}</p>
            <p style="margin: 4px 0;"><strong>Requester Mobile:</strong> {requester_mobile}</p>
            <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 12px 0;" />
            <p style="margin: 4px 0;"><strong>Message:</strong></p>
            <p style="color: #cbd5e1; font-style: italic; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 4px;">"{description}"</p>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="{conv_url}" style="background: linear-gradient(135deg, #06b6d4, #3b82f6); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Open Secure Conversation</a>
          </div>
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Campus Lost & Found System &bull; Private & Secure Conversation</p>
        </div>
        """
        return await cls.send_email(to_email, subject, body_text, body_html)

    @classmethod
    async def send_conversation_reply_email(
        cls,
        to_email: str,
        sender_name: str,
        item_name: str,
        conversation_id: str,
        recipient_role: str = "LOST_USER"
    ):
        """
        Notifies recipient of a new reply in the secure conversation without exposing plaintext message body.
        """
        subject = f"New Reply on Verification Request – Smart Campus Lost & Found"
        portal_path = "lost" if recipient_role == "LOST_USER" else "found"
        conv_url = f"http://localhost:5173/{portal_path}/conversations/{conversation_id}"

        body_text = (
            f"Hello,\n\n"
            f"{sender_name} has sent a new reply regarding the verification for '{item_name}'.\n\n"
            f"To view and reply to this message securely, click the link below:\n"
            f"[ Open Secure Conversation ]: {conv_url}\n\n"
            f"For your privacy, full message history is protected inside your authenticated account."
        )

        body_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 8px;">
          <h2 style="color: #34d399; margin-top: 0;">New Reply Received</h2>
          <p><strong>{sender_name}</strong> sent a new reply regarding your verification request for: <strong>{item_name}</strong>.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="{conv_url}" style="background: linear-gradient(135deg, #10b981, #06b6d4); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Open Secure Conversation</a>
          </div>
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Smart Campus Lost & Found System &bull; Verified Private Communication</p>
        </div>
        """
        return await cls.send_email(to_email, subject, body_text, body_html)

    @classmethod
    async def send_verification_request_notification(cls, to_email: str, item_name: str, request_id: str):
        subject = "Lost & Found Verification Request Received"
        body_text = (
            f"A Found Person has reported an item that potentially matches your reported lost item: '{item_name}'.\n\n"
            f"Verification Request Code: {request_id}\n\n"
            f"Please log in to your Lost User dashboard at http://localhost:5173/lost/login to review this request and perform ownership verification.\n\n"
            f"If you did not lose this item or do not recognize it, you can reject the request directly from your dashboard."
        )
        return await cls.send_email(to_email, subject, body_text)
