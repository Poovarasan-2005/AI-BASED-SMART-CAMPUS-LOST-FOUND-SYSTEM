import re
from typing import Dict, Any, List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class TextProcessor:
    @staticmethod
    def calculate_text_similarity(text1: str, text2: str) -> float:
        """
        Calculates TF-IDF cosine similarity between two text descriptions.
        """
        if not text1 or not text2:
            return 0.0
            
        clean1 = re.sub(r'[^\w\s]', '', text1.lower()).strip()
        clean2 = re.sub(r'[^\w\s]', '', text2.lower()).strip()
        
        if clean1 == clean2:
            return 1.0
            
        if not clean1 or not clean2:
            return 0.0

        try:
            vectorizer = TfidfVectorizer().fit([clean1, clean2])
            tfidf = vectorizer.transform([clean1, clean2])
            sim = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
            return float(np.clip(sim, 0.0, 1.0))
        except Exception:
            # Fallback to Jaccard token overlap
            tokens1 = set(clean1.split())
            tokens2 = set(clean2.split())
            if not tokens1 or not tokens2:
                return 0.0
            intersection = tokens1.intersection(tokens2)
            union = tokens1.union(tokens2)
            return float(len(intersection) / len(union))

    @staticmethod
    def parse_natural_language_query(query: str) -> Dict[str, Any]:
        """
        Parses natural language queries like: 'I lost my black backpack near the library yesterday'.
        Extracts Category, Color, Location, and Date heuristics.
        """
        q = query.lower()
        
        categories = ["backpack", "bag", "phone", "mobile", "laptop", "wallet", "keys", "id card", "water bottle", "watch", "earphones", "headphones", "umbrella", "glasses", "charger"]
        colors = ["black", "white", "red", "blue", "green", "yellow", "brown", "grey", "silver", "pink", "purple", "orange"]
        locations = ["library", "canteen", "main block", "hostel", "parking", "sports ground", "laboratory", "auditorium", "bus stop", "admin block"]

        extracted_category = None
        for cat in categories:
            if cat in q:
                extracted_category = cat.title()
                break

        extracted_color = None
        for col in colors:
            if col in q:
                extracted_color = col.title()
                break

        extracted_location = None
        for loc in locations:
            if loc in q:
                extracted_location = loc.title()
                break

        return {
            "query": query,
            "category": extracted_category,
            "color": extracted_color,
            "location": extracted_location
        }
