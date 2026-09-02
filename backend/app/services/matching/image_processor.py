import cv2
import numpy as np
from PIL import Image
import io
import base64
from typing import Dict, Any, Tuple

class ImageProcessor:
    @staticmethod
    def assess_image_quality(image_bytes: bytes) -> Dict[str, Any]:
        """
        Analyzes image for blurriness, darkness, brightness, and resolution.
        """
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                return {"is_valid": False, "reason": "Invalid image payload or corrupted format"}

            height, width, _ = img.shape
            if width < 100 or height < 100:
                return {"is_valid": False, "reason": "Resolution is too low (minimum 100x100 required)"}

            # Convert to grayscale for blur & brightness inspection
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Blur check via Laplacian variance
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            is_blurry = laplacian_var < 50.0  # Blur threshold
            
            # Brightness check
            mean_brightness = np.mean(gray)
            is_too_dark = mean_brightness < 30.0
            is_too_bright = mean_brightness > 230.0

            if is_blurry:
                return {"is_valid": False, "reason": "Image quality is too low (Image is blurry). Please upload a clearer image."}
            if is_too_dark:
                return {"is_valid": False, "reason": "Image is too dark. Please upload a well-lit photo."}
            if is_too_bright:
                return {"is_valid": False, "reason": "Image is overexposed/too bright."}

            return {
                "is_valid": True,
                "resolution": f"{width}x{height}",
                "blur_score": float(round(laplacian_var, 2)),
                "brightness_score": float(round(mean_brightness, 2))
            }
        except Exception as e:
            return {"is_valid": False, "reason": f"Image processing error: {str(e)}"}

    @staticmethod
    def extract_ai_visual_features(image_bytes: bytes) -> Dict[str, Any]:
        """
        Extracts dominant color profile, aspect ratio, shape heuristics, and color histogram vector.
        """
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                return {"dominant_color": "Unknown", "color_vector": []}

            # Convert to HSV for robust color classification
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            
            # Calculate dominant color
            h, s, v = cv2.split(hsv)
            avg_h = np.mean(h)
            avg_s = np.mean(s)
            avg_v = np.mean(v)

            dominant_color = "Other"
            if avg_v < 40:
                dominant_color = "Black"
            elif avg_v > 210 and avg_s < 30:
                dominant_color = "White"
            elif avg_s < 30:
                dominant_color = "Grey / Silver"
            elif avg_h < 10 or avg_h > 170:
                dominant_color = "Red"
            elif 10 <= avg_h < 25:
                dominant_color = "Orange / Brown"
            elif 25 <= avg_h < 35:
                dominant_color = "Yellow"
            elif 35 <= avg_h < 85:
                dominant_color = "Green"
            elif 85 <= avg_h < 130:
                dominant_color = "Blue"
            elif 130 <= avg_h <= 170:
                dominant_color = "Purple / Pink"

            # Color histogram feature vector (32-bin)
            hist = cv2.calcHist([hsv], [0, 1], None, [8, 4], [0, 180, 0, 256])
            cv2.normalize(hist, hist)
            hist_vector = hist.flatten().tolist()

            height, width, _ = img.shape
            aspect_ratio = round(width / float(height), 2)

            return {
                "dominant_color": dominant_color,
                "color_vector": [round(x, 4) for x in hist_vector],
                "aspect_ratio": aspect_ratio,
                "quality_passed": True
            }
        except Exception as e:
            return {"dominant_color": "Unknown", "color_vector": [], "aspect_ratio": 1.0, "quality_passed": False}

    @staticmethod
    def calculate_image_similarity(vec1: list, vec2: list) -> float:
        """
        Calculates cosine similarity between visual feature vectors.
        """
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.5  # Neutral default score if feature vectors absent

        v1 = np.array(vec1)
        v2 = np.array(vec2)
        
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.5
            
        similarity = np.dot(v1, v2) / (norm1 * norm2)
        return float(np.clip(similarity, 0.0, 1.0))
