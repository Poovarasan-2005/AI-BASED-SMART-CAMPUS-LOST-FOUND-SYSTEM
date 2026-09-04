import os
import io
import uuid
from PIL import Image
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query, status
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from app.database.db import get_database
from app.security.rbac import RoleChecker
from app.security.auth import get_current_user
from app.services.matching.image_processor import ImageProcessor
from app.services.matching.text_processor import TextProcessor
from app.services.matching.multimodal_matcher import MultimodalMatcher

router = APIRouter(prefix="/api/ai", tags=["AI Engine"])

# Directory to safely store uploaded item images
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Allowed extensions and MIME types
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 Megabytes

class AIMatchRequest(BaseModel):
    report_id: Optional[str] = "ALL"
    report_type: str  # "LOST" or "FOUND"
    category: Optional[str] = None
    location: Optional[str] = None
    min_confidence: Optional[int] = 0

class AINaturalSearchRequest(BaseModel):
    query: str

@router.post("/upload-image")
@router.post("/analyze-image")
async def upload_and_analyze_image(
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Production-grade Secure File Upload & Computer Vision Quality Assessment:
    - Validates file extension against whitelist (.jpg, .jpeg, .png, .webp)
    - Validates Content-Type header
    - Validates file size (limit 5MB)
    - Validates image header & byte integrity with PIL to reject dangerous/executable files
    - Assesses image blur, darkness, brightness, and resolution with OpenCV
    - Generates randomized cryptographic UUID filename
    - Saves safely to uploads/ directory
    - Extracts OpenCV visual feature vectors for Multimodal AI Matching
    """
    filename = file.filename or "image.jpg"
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Only JPG, PNG, and WEBP images are allowed."
        )

    if file.content_type and file.content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid MIME type '{file.content_type}'. Must be image/jpeg, image/png, or image/webp."
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowed limit of 5MB."
        )

    # Validate image format using PIL
    try:
        image_stream = io.BytesIO(contents)
        with Image.open(image_stream) as pil_img:
            pil_img.verify()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corrupted or invalid image file. Please upload a valid image."
        )

    # Quality check via OpenCV (blur, resolution, brightness)
    quality_result = ImageProcessor.assess_image_quality(contents)
    
    # Generate collision-free safe filename
    safe_filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    with open(dest_path, "wb") as f:
        f.write(contents)
        
    public_url = f"/uploads/{safe_filename}"
    visual_features = ImageProcessor.extract_ai_visual_features(contents)

    return {
        "success": True,
        "quality_passed": quality_result.get("is_valid", True),
        "quality_metrics": quality_result,
        "ai_features": visual_features,
        "image_url": public_url,
        "filename": safe_filename
    }

@router.post("/match")
async def find_ai_matches(
    req: AIMatchRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Multimodal AI Matching Engine:
    Compares Lost Items against Found Items across:
    - category
    - item name
    - description
    - brand
    - model
    - color
    - unique features
    - location
    - date
    - time
    - visual feature vectors

    Strict Terminology: Every match is labeled 'POTENTIAL MATCH' (Never 'CONFIRMED MATCH').
    Returns confidence score (5-99%) and explainable matching factors.
    """
    db = await get_database()
    matcher = MultimodalMatcher()
    matches = []
    
    user_id = user.get("uuid")
    report_type = req.report_type.upper()
    
    if report_type == "FOUND":
        # Found User looking for potential Lost matches
        if req.report_id and req.report_id != "ALL":
            found_reports = [await db["found_reports"].find_one({"uuid": req.report_id})]
            if not found_reports[0]:
                raise HTTPException(status_code=404, detail="Found report not found")
        else:
            # All active found reports owned by this user
            cursor = db["found_reports"].find({"user_id": user_id, "status": "ACTIVE"})
            found_reports = await cursor.to_list(100)
            if not found_reports:
                # If none found for user, find all active found reports
                cursor = db["found_reports"].find({"status": "ACTIVE"})
                found_reports = await cursor.to_list(50)

        cursor_lost = db["lost_reports"].find({"status": "ACTIVE"})
        all_lost = await cursor_lost.to_list(200)

        for found_rep in found_reports:
            if not found_rep:
                continue
            for lost_rep in all_lost:
                if lost_rep.get("user_id") == found_rep.get("user_id"):
                    continue

                # Filters
                if req.category and req.category != "ALL" and lost_rep.get("category", "").lower() != req.category.lower():
                    continue
                if req.location and req.location != "ALL" and req.location.lower() not in lost_rep.get("lost_location", "").lower():
                    continue

                score_data = matcher.compute_match_score(lost_rep, found_rep)
                overall_score = score_data["overall_match_score"]
                
                if overall_score < (req.min_confidence or 0):
                    continue

                clean_target = dict(lost_rep)
                clean_target.pop("secret_attribute", None)

                matches.append({
                    "id": f"MATCH-{lost_rep.get('uuid')[:8]}-{found_rep.get('uuid')[:8]}",
                    "my_report": found_rep,
                    "target_report": clean_target,
                    "target_type": "LOST",
                    "overall_match_score": overall_score,
                    "ranking": score_data["ranking"],
                    "score_breakdown": score_data["score_breakdown"],
                    "reasons": score_data["reasons"],
                    "disclaimer": score_data["disclaimer"],
                    "status": "POTENTIAL_MATCH",
                    "label": "POTENTIAL MATCH"
                })

    else:
        # Lost User looking for potential Found matches
        if req.report_id and req.report_id != "ALL":
            lost_reports = [await db["lost_reports"].find_one({"uuid": req.report_id})]
            if not lost_reports[0]:
                raise HTTPException(status_code=404, detail="Lost report not found")
        else:
            cursor = db["lost_reports"].find({"user_id": user_id, "status": "ACTIVE"})
            lost_reports = await cursor.to_list(100)
            if not lost_reports:
                cursor = db["lost_reports"].find({"status": "ACTIVE"})
                lost_reports = await cursor.to_list(50)

        cursor_found = db["found_reports"].find({"status": "ACTIVE"})
        all_found = await cursor_found.to_list(200)

        for lost_rep in lost_reports:
            if not lost_rep:
                continue
            for found_rep in all_found:
                if found_rep.get("user_id") == lost_rep.get("user_id"):
                    continue

                # Filters
                if req.category and req.category != "ALL" and found_rep.get("category", "").lower() != req.category.lower():
                    continue
                if req.location and req.location != "ALL" and req.location.lower() not in found_rep.get("found_location", "").lower():
                    continue

                score_data = matcher.compute_match_score(lost_rep, found_rep)
                overall_score = score_data["overall_match_score"]
                
                if overall_score < (req.min_confidence or 0):
                    continue

                clean_my = dict(lost_rep)
                clean_my.pop("secret_attribute", None)

                matches.append({
                    "id": f"MATCH-{lost_rep.get('uuid')[:8]}-{found_rep.get('uuid')[:8]}",
                    "my_report": clean_my,
                    "target_report": found_rep,
                    "target_type": "FOUND",
                    "overall_match_score": overall_score,
                    "ranking": score_data["ranking"],
                    "score_breakdown": score_data["score_breakdown"],
                    "reasons": score_data["reasons"],
                    "disclaimer": score_data["disclaimer"],
                    "status": "POTENTIAL_MATCH",
                    "label": "POTENTIAL MATCH"
                })

    # Sort descending by confidence score
    matches.sort(key=lambda x: x["overall_match_score"], reverse=True)
    return {"matches": matches, "total_matches": len(matches)}

@router.post("/natural-search")
async def natural_language_search(
    req: AINaturalSearchRequest,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Parses natural query ('I lost my black bag near the library yesterday') and returns matching reports.
    """
    db = await get_database()
    parsed = TextProcessor.parse_natural_language_query(req.query)
    
    query_filter = {"status": "ACTIVE"}
    if parsed.get("category"):
        query_filter["category"] = parsed["category"]
        
    cursor = db["found_reports"].find(query_filter)
    found_reports = await cursor.to_list(100)
    
    results = []
    for found in found_reports:
        sim = TextProcessor.calculate_text_similarity(
            req.query,
            f"{found.get('item_name', '')} {found.get('description', '')} {found.get('brand', '')} {found.get('color', '')}"
        )
        score = int(round(sim * 100))
        if parsed.get("color") and parsed["color"].lower() in found.get("color", "").lower():
            score += 20
        if parsed.get("location") and parsed["location"].lower() in found.get("found_location", "").lower():
            score += 20
        score = min(98, max(15, score))
        
        results.append({
            "report": found,
            "match_score": score,
            "label": "POTENTIAL MATCH"
        })
        
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return {
        "parsed_attributes": parsed,
        "results": results
    }
