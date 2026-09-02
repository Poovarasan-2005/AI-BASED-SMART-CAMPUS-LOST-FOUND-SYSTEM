from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from app.database.db import get_database
from app.security.rbac import RoleChecker
from app.services.matching.image_processor import ImageProcessor
from app.services.matching.text_processor import TextProcessor
from app.services.matching.multimodal_matcher import MultimodalMatcher

router = APIRouter(prefix="/api/ai", tags=["AI Engine"])

class AIMatchRequest(BaseModel):
    report_id: str
    report_type: str  # "LOST" or "FOUND"

class AINaturalSearchRequest(BaseModel):
    query: str

@router.post("/analyze-image")
async def analyze_uploaded_image(
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(RoleChecker(["LOST_USER", "FOUND_USER", "ADMIN"]))
):
    """
    Validates image quality (blur, darkness, brightness, resolution) and extracts visual feature vector.
    """
    contents = await file.read()
    
    # 1. Image Quality Check (Section 19)
    quality_result = ImageProcessor.assess_image_quality(contents)
    if not quality_result.get("is_valid", False):
        return {
            "success": False,
            "quality_passed": False,
            "message": quality_result.get("reason", "Image quality is too low.")
        }
        
    # 2. Visual Feature Extraction (Section 18)
    visual_features = ImageProcessor.extract_ai_visual_features(contents)
    
    return {
        "success": True,
        "quality_passed": True,
        "quality_metrics": quality_result,
        "ai_features": visual_features
    }

@router.post("/match")
async def find_ai_matches(
    req: AIMatchRequest,
    user: Dict[str, Any] = Depends(RoleChecker(["LOST_USER", "FOUND_USER", "ADMIN"]))
):
    """
    Compares a given report against target database reports using Multimodal AI Matching.
    Generates ranked results with Explainable AI score breakdowns.
    """
    db = await get_database()
    matcher = MultimodalMatcher()
    
    matches = []
    
    if req.report_type.upper() == "FOUND":
        # Found User looking for potential Lost matches
        found_report = await db["found_reports"].find_one({"uuid": req.report_id})
        if not found_report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Found report not found")
            
        cursor = db["lost_reports"].find({"status": "ACTIVE"})
        lost_reports = await cursor.to_list(200)
        
        for lost in lost_reports:
            # Exclude reports by same user
            if lost.get("user_id") == found_report.get("user_id"):
                continue
                
            score_data = matcher.compute_match_score(lost, found_report)
            
            # Hide secret attribute and private Lost user credentials
            clean_lost = dict(lost)
            clean_lost.pop("secret_attribute", None)
            
            matches.append({
                "target_report": clean_lost,
                "overall_match_score": score_data["overall_match_score"],
                "ranking": score_data["ranking"],
                "score_breakdown": score_data["score_breakdown"],
                "reasons": score_data["reasons"],
                "disclaimer": score_data["disclaimer"]
            })
            
    else:
        # Lost User looking for potential Found matches
        lost_report = await db["lost_reports"].find_one({"uuid": req.report_id})
        if not lost_report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lost report not found")
            
        cursor = db["found_reports"].find({"status": "ACTIVE"})
        found_reports = await cursor.to_list(200)
        
        for found in found_reports:
            if found.get("user_id") == lost_report.get("user_id"):
                continue
                
            score_data = matcher.compute_match_score(lost_report, found)
            
            matches.append({
                "target_report": found,
                "overall_match_score": score_data["overall_match_score"],
                "ranking": score_data["ranking"],
                "score_breakdown": score_data["score_breakdown"],
                "reasons": score_data["reasons"],
                "disclaimer": score_data["disclaimer"]
            })

    # Sort descending by match score
    matches.sort(key=lambda x: x["overall_match_score"], reverse=True)
    return {"matches": matches}

@router.post("/natural-search")
async def natural_language_search(
    req: AINaturalSearchRequest,
    user: Dict[str, Any] = Depends(RoleChecker(["LOST_USER", "FOUND_USER", "ADMIN"]))
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
        sim = TextProcessor.calculate_text_similarity(req.query, f"{found.get('item_name', '')} {found.get('description', '')}")
        score = int(round(sim * 100))
        if parsed.get("color") and parsed["color"].lower() in found.get("color", "").lower():
            score += 20
        if parsed.get("location") and parsed["location"].lower() in found.get("found_location", "").lower():
            score += 20
        score = min(98, score)
        
        results.append({
            "report": found,
            "match_score": score
        })
        
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return {
        "parsed_attributes": parsed,
        "results": results
    }
