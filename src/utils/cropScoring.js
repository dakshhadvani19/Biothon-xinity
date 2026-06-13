// Comprehensive dictionary of crop ideal temperature ranges (Min °C, Max °C)
// This covers 100+ crops commonly grown globally and specifically in regions like India.
const CROP_TEMP_RANGES = {
  // Cereals & Grains
  'wheat': [15, 25],
  'rice': [20, 35],
  'maize': [21, 27],
  'corn': [21, 27],
  'barley': [12, 25],
  'sorghum': [25, 32],
  'jowar': [25, 32],
  'pearl millet': [25, 35],
  'bajra': [25, 35],
  'finger millet': [20, 30],
  'ragi': [20, 30],
  'oats': [15, 25],

  // Pulses & Legumes
  'chickpea': [20, 30],
  'gram': [20, 30],
  'pigeon pea': [25, 35],
  'arhar': [25, 35],
  'lentil': [15, 25],
  'masoor': [15, 25],
  'black gram': [25, 35],
  'urad': [25, 35],
  'green gram': [25, 35],
  'moong': [25, 35],
  'soybean': [20, 30],
  'pea': [13, 21],
  'beans': [15, 27],
  'cowpea': [20, 30],

  // Oilseeds
  'groundnut': [25, 30],
  'peanut': [25, 30],
  'mustard': [15, 25],
  'sunflower': [20, 30],
  'safflower': [15, 25],
  'sesame': [25, 35],
  'linseed': [10, 25],
  'castor': [20, 30],

  // Cash Crops
  'cotton': [21, 30],
  'sugarcane': [20, 35],
  'jute': [24, 35],
  'tobacco': [20, 30],
  'tea': [13, 30],
  'coffee': [15, 28],
  'rubber': [25, 35],

  // Vegetables
  'tomato': [20, 27],
  'potato': [15, 25],
  'onion': [13, 24],
  'garlic': [13, 24],
  'cabbage': [15, 20],
  'cauliflower': [15, 20],
  'broccoli': [15, 20],
  'carrot': [15, 20],
  'radish': [10, 18],
  'spinach': [10, 20],
  'lettuce': [15, 20],
  'brinjal': [21, 28],
  'eggplant': [21, 28],
  'capsicum': [21, 25],
  'bell pepper': [21, 25],
  'chili': [20, 30],
  'okra': [22, 35],
  'lady finger': [22, 35],
  'cucumber': [20, 30],
  'pumpkin': [20, 30],
  'bottle gourd': [24, 30],
  'bitter gourd': [24, 30],
  'ridge gourd': [24, 30],
  'sweet potato': [21, 28],
  'beetroot': [15, 20],

  // Fruits
  'mango': [24, 30],
  'banana': [26, 30],
  'apple': [15, 24],
  'grapes': [15, 40],
  'orange': [13, 30],
  'citrus': [13, 30],
  'lemon': [13, 30],
  'papaya': [22, 26],
  'guava': [23, 28],
  'pineapple': [22, 32],
  'pomegranate': [25, 35],
  'watermelon': [25, 30],
  'muskmelon': [25, 30],
  'strawberry': [15, 25],
  'lychee': [15, 30],
  'peach': [15, 25],
  'plum': [15, 25],
  'coconut': [27, 32],

  // Spices & Others
  'turmeric': [20, 30],
  'ginger': [20, 30],
  'black pepper': [20, 30],
  'cardamom': [15, 25],
  'clove': [20, 30],
  'coriander': [15, 25],
  'cumin': [20, 30],
  'fennel': [15, 25],
  'fenugreek': [15, 25],

  // Generic Fallbacks
  'vegetable': [18, 28],
  'fruit': [20, 30],
  'flower': [15, 25],
};

const DEFAULT_RANGE = [20, 30]; // Safe generic range

/**
 * Calculates a Growth Score out of 10 based on crop type and temperature.
 * @param {string} cropName - The name of the crop
 * @param {number} currentTemp - The temperature in Celsius
 * @returns {number} Score from 0.0 to 10.0
 */
export const calculateGrowthScore = (cropName, currentTemp) => {
  if (currentTemp == null) return 0;

  const normalizedCrop = (cropName || '').toLowerCase().trim();
  let range = CROP_TEMP_RANGES[normalizedCrop];

  // Try partial match if exact match fails (e.g., "Tomato (Tamatar)" -> "tomato")
  if (!range) {
    const matchedKey = Object.keys(CROP_TEMP_RANGES).find(key => normalizedCrop.includes(key));
    if (matchedKey) {
      range = CROP_TEMP_RANGES[matchedKey];
    }
  }

  // Fallback to default
  if (!range) {
    range = DEFAULT_RANGE;
  }

  const [min, max] = range;
  const optimal = (min + max) / 2;
  const tolerance = (max - min) / 2; // Strict tolerance
  const extendedTolerance = tolerance * 2; // Looser tolerance before hitting 0

  if (currentTemp >= min && currentTemp <= max) {
    // Within ideal range, score drops slightly as it moves away from exact optimal
    const deviation = Math.abs(currentTemp - optimal);
    const score = 10 - (deviation / tolerance) * 2; // e.g. 10 at center, 8 at edges
    return Math.max(8, parseFloat(score.toFixed(1)));
  } else {
    // Outside ideal range
    const deviation = Math.abs(currentTemp - optimal) - tolerance;
    if (deviation > extendedTolerance) {
      return Math.max(0, parseFloat((10 - deviation).toFixed(1))); // Cap lowest drops, or just return 0 if extremely far
    }
    const score = 8 - (deviation / extendedTolerance) * 8; // Drops from 8 down to 0
    return Math.max(0, parseFloat(score.toFixed(1)));
  }
};
