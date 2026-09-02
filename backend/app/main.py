from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uuid
from datetime import datetime
from app.config import settings
from app.database.db import get_database
from app.security.auth import hash_password
from app.routes.auth_routes import router as auth_router
from app.routes.lost_routes import router as lost_router
from app.routes.found_routes import router as found_router
from app.routes.ai_routes import router as ai_router
from app.routes.verification_routes import router as verification_router
from app.routes.recovery_routes import router as recovery_router
from app.routes.admin_routes import router as admin_router
from app.routes.conversation_routes import router as conversation_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database and default admin
    db = await get_database()
    
    admin = await db["users"].find_one({"email": "admin@campuslostfound.edu"})
    if not admin:
        admin_id = str(uuid.uuid4())
        admin_doc = {
            "id": admin_id,
            "uuid": admin_id,
            "full_name": "System Administrator",
            "email": "admin@campuslostfound.edu",
            "password_hash": hash_password("AdminPass123!"),
            "role": "ADMIN",
            "mobile": "0000000000",
            "phone_number": "0000000000",
            "phone_verified": True,
            "department": "Campus Security & IT",
            "year": "N/A",
            "email_verified": True,
            "account_status": "ACTIVE",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "last_login_at": None
        }
        await db["users"].insert_one(admin_doc)
        print("Initialized Default Admin Account: admin@campuslostfound.edu / AdminPass123!")
    
    yield
    # Shutdown code here if needed

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Secure AI-Based Smart Campus Lost & Found System API with Dual Authentication, Multimodal AI Matching, Mobile OTP, and Private Verified Conversations.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(lost_router)
app.include_router(found_router)
app.include_router(ai_router)
app.include_router(verification_router)
app.include_router(recovery_router)
app.include_router(admin_router)
app.include_router(conversation_router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": "1.0.0",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
