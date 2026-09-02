from fastapi import APIRouter, HTTPException, Depends, status, Request
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from app.config import settings
from app.database.db import get_database
from app.security.auth import hash_password, verify_password, create_access_token, get_current_user
from app.security.otp import generate_secure_otp, generate_secure_token, hash_otp, verify_otp_hash
from app.security.audit import log_security_event
from app.security.rate_limiter import auth_limiter, otp_gen_limiter, otp_verify_limiter
from app.services.email.email_service import EmailService
from app.services.sms.sms_provider import SMSProvider

router = APIRouter(prefix="/api", tags=["Authentication"])

class UserRegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str
    mobile: Optional[str] = ""
    department: Optional[str] = "Computer Science"
    year: Optional[str] = "2026"

class UserLoginRequest(BaseModel):
    email: str
    password: str

class VerifyEmailRequest(BaseModel):
    token: str

class DirectVerifyRequest(BaseModel):
    email: str

class SendPhoneOTPRequest(BaseModel):
    phone_number: str

class VerifyPhoneOTPRequest(BaseModel):
    otp: str

@router.post("/lost/register")
async def register_lost_user(req: UserRegisterRequest, request: Request):
    auth_limiter.check(request.client.host)
    return await _register_user(req, role="LOST_USER", req_obj=request)

@router.post("/found/register")
async def register_found_user(req: UserRegisterRequest, request: Request):
    auth_limiter.check(request.client.host)
    return await _register_user(req, role="FOUND_USER", req_obj=request)

async def _register_user(req: UserRegisterRequest, role: str, req_obj: Request):
    db = await get_database()
    email_clean = req.email.lower().strip()
    
    # Check if user already exists
    existing = await db["users"].find_one({"email": email_clean})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )
        
    user_id = str(uuid.uuid4())
    pwd_hash = hash_password(req.password)
    verification_token = generate_secure_token()
    
    # Auto-verify email/phone in local development mode if SMTP host is not configured
    is_dev = not bool(settings.EMAIL_HOST and settings.EMAIL_USERNAME)
    now_iso = datetime.utcnow().isoformat()
    
    user_doc = {
        "id": user_id,
        "uuid": user_id,
        "full_name": req.full_name,
        "email": email_clean,
        "password_hash": pwd_hash,
        "role": role,
        "mobile": req.mobile,
        "phone_number": req.mobile,
        "phone_verified": True if is_dev else False,
        "phone_verified_at": now_iso if is_dev else None,
        "department": req.department,
        "year": req.year,
        "email_verified": True if is_dev else False,
        "account_status": "ACTIVE" if is_dev else "EMAIL_VERIFICATION_PENDING",
        "created_at": now_iso,
        "updated_at": now_iso,
        "last_login_at": None
    }
    
    await db["users"].insert_one(user_doc)
    
    # Store email token
    token_doc = {
        "id": str(uuid.uuid4()),
        "token": verification_token,
        "user_id": user_id,
        "purpose": "EMAIL_VERIFICATION",
        "expires_at": (datetime.utcnow() + timedelta(minutes=60)).isoformat(),
        "used": is_dev
    }
    await db["email_verifications"].insert_one(token_doc)
    
    # Send verification email
    await EmailService.send_verification_email(email_clean, verification_token, role)
    
    await log_security_event(
        action="USER_REGISTERED",
        user_id=user_id,
        resource_type="USER",
        resource_id=user_id,
        ip_address=req_obj.client.host,
        metadata={"role": role}
    )
    
    msg = f"Registration successful as {role}."
    if is_dev:
        msg += " Email & Phone automatically verified for local development mode!"
    else:
        msg += " Please check your email and mobile to verify your account."
        
    return {
        "message": msg,
        "user_id": user_id,
        "role": role,
        "email_verified": user_doc["email_verified"],
        "phone_verified": user_doc["phone_verified"],
        "verification_token_dev": verification_token
    }

@router.post("/lost/login")
async def login_lost_user(req: UserLoginRequest, request: Request):
    auth_limiter.check(request.client.host)
    return await _login_user(req, expected_role="LOST_USER", req_obj=request)

@router.post("/found/login")
async def login_found_user(req: UserLoginRequest, request: Request):
    auth_limiter.check(request.client.host)
    return await _login_user(req, expected_role="FOUND_USER", req_obj=request)

@router.post("/admin/login")
async def login_admin_user(req: UserLoginRequest, request: Request):
    auth_limiter.check(request.client.host)
    return await _login_user(req, expected_role="ADMIN", req_obj=request)

async def _login_user(req: UserLoginRequest, expected_role: str, req_obj: Request):
    db = await get_database()
    email_clean = req.email.lower().strip()
    
    user = await db["users"].find_one({"email": email_clean})
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        await log_security_event(
            action="LOGIN_FAILED",
            user_id="ANONYMOUS",
            ip_address=req_obj.client.host,
            success=False,
            metadata={"email": email_clean, "expected_role": expected_role}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email credentials or password."
        )

    # Check Role
    if user.get("role") != expected_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access Denied: Account registered as '{user.get('role')}', cannot log in through '{expected_role}' portal."
        )

    # Auto-verify unverified user in Dev Mode (no SMTP configured)
    is_dev = not bool(settings.EMAIL_HOST and settings.EMAIL_USERNAME)
    if not user.get("email_verified", False) and user.get("role") != "ADMIN":
        if is_dev:
            await db["users"].update_one(
                {"_id": user["_id"]},
                {"$set": {
                    "email_verified": True,
                    "phone_verified": True,
                    "account_status": "ACTIVE"
                }}
            )
            user["email_verified"] = True
            user["phone_verified"] = True
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email address is unverified. Please verify your email address before logging in."
            )
        
    if user.get("account_status") in ["SUSPENDED", "LOCKED"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended or locked by an administrator."
        )

    now_iso = datetime.utcnow().isoformat()
    await db["users"].update_one({"_id": user["_id"]}, {"$set": {"last_login_at": now_iso}})

    token_data = {
        "sub": user["uuid"],
        "email": user["email"],
        "role": user["role"],
        "full_name": user["full_name"]
    }
    access_token = create_access_token(data=token_data)

    await log_security_event(
        action="LOGIN_SUCCESS",
        user_id=user["uuid"],
        resource_type="USER",
        resource_id=user["uuid"],
        ip_address=req_obj.client.host
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "uuid": user["uuid"],
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"],
            "phone_number": user.get("phone_number") or user.get("mobile", ""),
            "phone_verified": user.get("phone_verified", True),
            "department": user.get("department", "")
        }
    }

@router.post("/user/send-phone-otp")
async def send_phone_verification_otp(
    req: SendPhoneOTPRequest,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    otp_gen_limiter.check(request.client.host)
    db = await get_database()
    
    raw_otp = generate_secure_otp(length=6)
    hashed = hash_otp(raw_otp)
    exp = (datetime.utcnow() + timedelta(minutes=10)).isoformat()
    
    await db["phone_verifications"].insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["uuid"],
        "phone_number": req.phone_number,
        "otp_hash": hashed,
        "expires_at": exp,
        "used": False,
        "created_at": datetime.utcnow().isoformat()
    })

    # Update user phone_number
    await db["users"].update_one(
        {"uuid": current_user["uuid"]},
        {"$set": {"phone_number": req.phone_number, "mobile": req.phone_number}}
    )

    await SMSProvider.send_phone_verification_otp_sms(req.phone_number, raw_otp)
    
    return {
        "message": f"Verification OTP sent to mobile number {req.phone_number}",
        "otp_dev_mode": raw_otp
    }

@router.post("/user/verify-phone-otp")
async def verify_phone_otp(
    req: VerifyPhoneOTPRequest,
    request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    otp_verify_limiter.check(request.client.host)
    db = await get_database()
    
    doc = await db["phone_verifications"].find_one({
        "user_id": current_user["uuid"],
        "used": False
    })
    
    if not doc or not verify_otp_hash(req.otp, doc.get("otp_hash", "")):
        raise HTTPException(status_code=400, detail="Invalid or expired mobile verification OTP.")
        
    now_iso = datetime.utcnow().isoformat()
    await db["phone_verifications"].update_one({"_id": doc["_id"]}, {"$set": {"used": True}})
    
    await db["users"].update_one(
        {"uuid": current_user["uuid"]},
        {"$set": {"phone_verified": True, "phone_verified_at": now_iso}}
    )

    await log_security_event(
        action="PHONE_VERIFIED",
        user_id=current_user["uuid"],
        resource_type="USER",
        resource_id=current_user["uuid"],
        ip_address=request.client.host
    )

    return {"message": "Mobile number verified successfully!", "phone_verified": True}

@router.post("/email/verify")
async def verify_email(req: VerifyEmailRequest, request: Request):
    db = await get_database()
    token_doc = await db["email_verifications"].find_one({"token": req.token, "used": False})
    
    if not token_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token."
        )
        
    user_id = token_doc["user_id"]
    await db["users"].update_one(
        {"uuid": user_id},
        {"$set": {
            "email_verified": True,
            "phone_verified": True,
            "account_status": "ACTIVE",
            "updated_at": datetime.utcnow().isoformat()
        }}
    )
    await db["email_verifications"].update_one({"_id": token_doc["_id"]}, {"$set": {"used": True}})

    await log_security_event(
        action="EMAIL_VERIFIED",
        user_id=user_id,
        resource_type="USER",
        resource_id=user_id,
        ip_address=request.client.host
    )

    return {"message": "Email verified successfully! You may now log in."}

@router.post("/dev/direct-verify")
async def direct_verify_account(req: DirectVerifyRequest):
    db = await get_database()
    email_clean = req.email.lower().strip()
    user = await db["users"].find_one({"email": email_clean})
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
        
    await db["users"].update_one(
        {"_id": user["_id"]},
        {"$set": {"email_verified": True, "phone_verified": True, "account_status": "ACTIVE"}}
    )
    return {"message": f"Account '{email_clean}' has been verified! You can log in now."}
