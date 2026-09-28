/**
 * Client-Side Multimodal AI Matcher & Natural Language Engine
 * Replaces the Python backend matching engine with high-performance, client-side algorithms.
 */

// Category keywords vocabulary
const KNOWN_CATEGORIES = [
  'Electronics & Laptops', 'Mobile Phone', 'Audio & Headphones',
  'Bottles & Containers', 'Wallets & IDs', 'Keys & Badges',
  'Stationery & Calculators', 'Bags & Backpacks', 'Jewelry & Watches',
  'Clothing & Apparel', 'Books & Notebooks'
];

// Color keywords
const KNOWN_COLORS = [
  'black', 'white', 'silver', 'gray', 'grey', 'space gray', 'blue', 'navy',
  'red', 'pink', 'green', 'yellow', 'gold', 'orange', 'purple', 'brown'
];

// Campus building / location keywords
const KNOWN_LOCATIONS = [
  'library', 'engineering', 'cafeteria', 'student center', 'union',
  'auditorium', 'gym', 'sports', 'lab', 'hall', 'campus security', 'quad'
];

/**
 * Tokenize string into normalized words
 */
function tokenize(text) {
  if (!text) return [];
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

/**
 * Jaccard text similarity between two strings
 */
function textSimilarity(str1, str2) {
  const setA = new Set(tokenize(str1));
  const setB = new Set(tokenize(str2));
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Computes multimodal match score between Lost Report and Found Report.
 */
export function computeItemMatch(lostItem, foundItem) {
  const reasons = [];

  // 1. Category & Brand (20%)
  const cat1 = (lostItem.category || '').toLowerCase().trim();
  const cat2 = (foundItem.category || '').toLowerCase().trim();
  const catMatch = cat1 && cat2 && (cat1 === cat2 || cat1.includes(cat2) || cat2.includes(cat1));

  const brand1 = (lostItem.brand || '').toLowerCase().trim();
  const brand2 = (foundItem.brand || '').toLowerCase().trim();
  const brandMatch = brand1 && brand2 && (brand1 === brand2 || brand1.includes(brand2) || brand2.includes(brand1));

  let catBrandScore = 0;
  if (catMatch && brandMatch) {
    catBrandScore = 1.0;
    reasons.push('✓ Matching item category & manufacturer brand');
  } else if (catMatch) {
    catBrandScore = 0.8;
    reasons.push('✓ Same item category');
  } else if (brandMatch) {
    catBrandScore = 0.5;
    reasons.push('✓ Matching brand');
  }

  // 2. Color & Unique Attributes (20%)
  const color1 = (lostItem.color || '').toLowerCase().trim();
  const color2 = (foundItem.color || '').toLowerCase().trim();
  const colorMatch = color1 && color2 && (color1 === color2 || color1.includes(color2) || color2.includes(color1));

  let featureScore = 0.4;
  if (colorMatch) {
    featureScore += 0.5;
    reasons.push('✓ Matching color specifications');
  }

  const sn1 = (lostItem.serial_number || lostItem.serialNumber || '').trim().toLowerCase();
  const sn2 = (foundItem.serial_number || foundItem.serialNumber || '').trim().toLowerCase();
  if (sn1 && sn2 && sn1 === sn2) {
    featureScore = 1.0;
    reasons.push('✓ Matching serial number verified');
  }

  // 3. Text Semantic Match (25%)
  const desc1 = `${lostItem.title || lostItem.item_name || ''} ${lostItem.description || ''}`;
  const desc2 = `${foundItem.title || foundItem.item_name || ''} ${foundItem.description || ''}`;
  const textScore = Math.min(1.0, textSimilarity(desc1, desc2) * 2.2);
  if (textScore > 0.4) {
    reasons.push('✓ High semantic description similarity');
  }

  // 4. Location Proximity (15%)
  const loc1 = (lostItem.lost_location || lostItem.lostLocation || '').toLowerCase();
  const loc2 = (foundItem.found_location || foundItem.foundLocation || '').toLowerCase();
  let locScore = 0.2;
  if (loc1 && loc2) {
    if (loc1 === loc2) {
      locScore = 1.0;
      reasons.push('✓ Discovered at identical campus location');
    } else {
      const locSim = textSimilarity(loc1, loc2);
      if (locSim > 0.25) {
        locScore = 0.85;
        reasons.push('✓ Discovered in adjacent campus facility');
      }
    }
  }

  // 5. Date Proximity (10%)
  const d1Str = lostItem.lost_date || lostItem.lostDate;
  const d2Str = foundItem.found_date || foundItem.foundDate;
  let dateScore = 0.5;
  if (d1Str && d2Str) {
    const diffMs = Math.abs(new Date(d2Str) - new Date(d1Str));
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) {
      dateScore = 1.0;
      reasons.push('✓ Found within 24 hours of report date');
    } else if (diffDays <= 3) {
      dateScore = 0.8;
      reasons.push('✓ Reported lost within 3 days of discovery');
    } else if (diffDays <= 7) {
      dateScore = 0.6;
    }
  }

  // 6. Visual Tags / Image Feature Similarity (10%)
  const tags1 = lostItem.aiFingerprint?.tags || lostItem.ai_features?.tags || [];
  const tags2 = foundItem.aiFingerprint?.tags || foundItem.ai_features?.tags || [];
  let visualScore = 0.5;
  if (tags1.length > 0 && tags2.length > 0) {
    const commonTags = tags1.filter(t => tags2.includes(t));
    if (commonTags.length > 0) {
      visualScore = Math.min(1.0, 0.4 + (commonTags.length / Math.max(tags1.length, tags2.length)));
      reasons.push(`✓ Visual feature match (${commonTags.slice(0, 3).join(', ')})`);
    }
  }

  // Weighted total (0.0 to 1.0)
  const totalScore = (
    catBrandScore * 0.20 +
    featureScore * 0.20 +
    textScore * 0.25 +
    locScore * 0.15 +
    dateScore * 0.10 +
    visualScore * 0.10
  );

  const confidenceScore = Math.min(99, Math.max(12, Math.round(totalScore * 100)));
  const matchStrength = confidenceScore >= 80 ? 'HIGH' : (confidenceScore >= 55 ? 'MEDIUM' : 'LOW');

  if (reasons.length === 0) {
    reasons.push('General category candidate match');
  }

  return {
    confidence_score: confidenceScore,
    match_score: totalScore,
    match_strength: matchStrength,
    reasons,
    breakdown: {
      visual_similarity: Math.round(visualScore * 100),
      text_similarity: Math.round(textScore * 100),
      category_similarity: Math.round(catBrandScore * 100),
      location_proximity: Math.round(locScore * 100),
      date_proximity: Math.round(dateScore * 100)
    }
  };
}

/**
 * Natural language search parser and ranker
 */
export function naturalSearchItems(query, allItems) {
  if (!query || !query.trim()) return { results: [], parsed_attributes: {} };

  const qLower = query.toLowerCase();
  const parsed = {
    category: null,
    color: null,
    location: null,
    keywords: []
  };

  for (const cat of KNOWN_CATEGORIES) {
    if (qLower.includes(cat.toLowerCase())) {
      parsed.category = cat;
      break;
    }
  }

  for (const color of KNOWN_COLORS) {
    if (qLower.includes(color)) {
      parsed.color = color;
      break;
    }
  }

  for (const loc of KNOWN_LOCATIONS) {
    if (qLower.includes(loc)) {
      parsed.location = loc;
      break;
    }
  }

  parsed.keywords = tokenize(query);

  const scoredResults = allItems.map(item => {
    let score = 0;
    const itemText = `${item.title || item.item_name || ''} ${item.description || ''} ${item.category || ''} ${item.brand || ''} ${item.color || ''} ${item.lost_location || item.found_location || ''}`.toLowerCase();

    // Word matches
    for (const kw of parsed.keywords) {
      if (itemText.includes(kw)) score += 0.35;
    }

    if (parsed.category && (item.category || '').toLowerCase().includes(parsed.category.toLowerCase())) {
      score += 0.6;
    }

    if (parsed.color && (item.color || '').toLowerCase().includes(parsed.color)) {
      score += 0.4;
    }

    if (parsed.location && (item.lost_location || item.found_location || '').toLowerCase().includes(parsed.location)) {
      score += 0.4;
    }

    const normalizedScore = Math.min(0.99, Math.max(0.15, score));
    return {
      report: item,
      match_score: Math.round(normalizedScore * 100),
      label: normalizedScore >= 0.75 ? 'HIGH_MATCH' : (normalizedScore >= 0.45 ? 'RELEVANT' : 'POTENTIAL_MATCH')
    };
  });

  scoredResults.sort((a, b) => b.match_score - a.match_score);
  return {
    results: scoredResults.filter(r => r.match_score >= 25),
    parsed_attributes: parsed
  };
}
