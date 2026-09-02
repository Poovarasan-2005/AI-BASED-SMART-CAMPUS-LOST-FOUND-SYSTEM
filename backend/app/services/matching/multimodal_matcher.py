import math
from datetime import datetime
from typing import Dict, Any, List
from app.services.matching.image_processor import ImageProcessor
from app.services.matching.text_processor import TextProcessor

class MultimodalMatcher:
    def __init__(self, weights: Dict[str, float] = None):
        # Default weights from Section 21 specification
        self.weights = weights or {
            "image": 0.40,
            "text": 0.20,
            "features": 0.15,
            "location": 0.10,
            "date": 0.05,
            "time": 0.05,
            "category_brand": 0.05
        }

    def compute_match_score(self, lost_report: Dict[str, Any], found_report: Dict[str, Any]) -> Dict[str, Any]:
        """
        Computes overall multimodal match score between a Lost report and a Found report.
        Produces explainable AI matching reasons.
        """
        reasons = []
        
        # 1. Category & Brand Score (5%)
        cat_match = (lost_report.get("category", "").lower() == found_report.get("category", "").lower())
        brand_lost = lost_report.get("brand", "").lower().strip()
        brand_found = found_report.get("brand", "").lower().strip()
        brand_match = (brand_lost and brand_found and brand_lost == brand_found)
        
        if cat_match:
            reasons.append("✓ Same item category")
        if brand_match:
            reasons.append("✓ Matching brand")

        cat_brand_score = 1.0 if (cat_match and brand_match) else (0.8 if cat_match else (0.4 if brand_match else 0.0))

        # 2. Color & Visual Features Score (15%)
        color_lost = lost_report.get("color", "").lower().strip()
        color_found = found_report.get("color", "").lower().strip()
        color_match = (color_lost and color_found and color_lost == color_found)
        
        features_score = 0.5
        if color_match:
            reasons.append("✓ Matching color profile")
            features_score += 0.5
            
        # Serial number check
        sn_lost = lost_report.get("serial_number", "").strip()
        sn_found = found_report.get("serial_number", "").strip()
        if sn_lost and sn_found and sn_lost.lower() == sn_found.lower():
            reasons.append("✓ Matching serial number")
            features_score = 1.0

        # 3. Image Similarity Score (40%)
        vec1 = lost_report.get("ai_features", {}).get("color_vector", [])
        vec2 = found_report.get("ai_features", {}).get("color_vector", [])
        image_score = ImageProcessor.calculate_image_similarity(vec1, vec2)
        if image_score > 0.70:
            reasons.append("✓ High visual similarity structure")

        # 4. Text Description Similarity Score (20%)
        desc1 = f"{lost_report.get('item_name', '')} {lost_report.get('description', '')}"
        desc2 = f"{found_report.get('item_name', '')} {found_report.get('description', '')}"
        text_score = TextProcessor.calculate_text_similarity(desc1, desc2)
        if text_score > 0.40:
            reasons.append("✓ Matching description keywords")

        # 5. Location Proximity Score (10%)
        loc1 = lost_report.get("lost_location", "").lower().strip()
        loc2 = found_report.get("found_location", "").lower().strip()
        if loc1 == loc2:
            location_score = 1.0
            reasons.append("✓ Identical campus location")
        elif any(part in loc2 for part in loc1.split()) or any(part in loc1 for part in loc2.split()):
            location_score = 0.8
            reasons.append("✓ Nearby campus zone")
        else:
            location_score = 0.3

        # 6. Date Proximity Score (5%)
        date_score = 0.5
        try:
            d1 = datetime.strptime(lost_report.get("lost_date", ""), "%Y-%m-%d")
            d2 = datetime.strptime(found_report.get("found_date", ""), "%Y-%m-%d")
            diff_days = abs((d2 - d1).days)
            if diff_days <= 1:
                date_score = 1.0
                reasons.append("✓ Close reporting date")
            elif diff_days <= 3:
                date_score = 0.8
            elif diff_days <= 7:
                date_score = 0.6
            else:
                date_score = 0.2
        except Exception:
            date_score = 0.5

        # 7. Time Proximity Score (5%)
        time_score = 0.5
        t1 = lost_report.get("lost_time", "")
        t2 = found_report.get("found_time", "")
        if t1 and t2 and t1.strip() == t2.strip():
            time_score = 1.0
            reasons.append("✓ Approximate time proximity")

        # Weighted Total Score Calculation
        total_score = (
            image_score * self.weights["image"] +
            text_score * self.weights["text"] +
            features_score * self.weights["features"] +
            location_score * self.weights["location"] +
            date_score * self.weights["date"] +
            time_score * self.weights["time"] +
            cat_brand_score * self.weights["category_brand"]
        )

        match_percentage = int(round(total_score * 100))
        match_percentage = max(5, min(99, match_percentage))  # Keep within 5-99%

        # Ranking Classification
        if match_percentage >= 90:
            ranking = "VERY HIGH"
        elif match_percentage >= 75:
            ranking = "HIGH"
        elif match_percentage >= 60:
            ranking = "MEDIUM"
        else:
            ranking = "LOW"

        return {
            "overall_match_score": match_percentage,
            "ranking": ranking,
            "score_breakdown": {
                "image_similarity": int(round(image_score * 100)),
                "text_similarity": int(round(text_score * 100)),
                "distinctive_features": int(round(features_score * 100)),
                "location_similarity": int(round(location_score * 100)),
                "date_similarity": int(round(date_score * 100)),
                "time_similarity": int(round(time_score * 100)),
                "category_brand": int(round(cat_brand_score * 100))
            },
            "reasons": reasons,
            "disclaimer": "AI Match Confidence score represents probabilistic visual & contextual similarity. Final ownership requires secure verification."
        }
