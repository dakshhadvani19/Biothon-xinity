/**
 * hindiNumbers.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Converts Arabic digits embedded in any Hindi (or mixed) text to their
 * spoken Hindi word equivalents so that WebSpeech TTS reads them in Hindi.
 *
 * Examples:
 *   "स्कोर 75 में से 100 है"  →  "स्कोर पचहत्तर में से सौ है"
 *   "25 डिग्री तापमान"       →  "पच्चीस डिग्री तापमान"
 *   "1500 मिमी वर्षा"        →  "एक हज़ार पाँच सौ मिमी वर्षा"
 */

// 0–99 lookup table (the most correct spoken Hindi forms)
const ONES = [
  'शून्य', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ',
  'दस', 'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस',
  'बीस', 'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस',
  'तीस', 'इकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस',
  'चालीस', 'इकतालीस', 'बयालीस', 'तैंतालीस', 'चवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास',
  'पचास', 'इक्यावन', 'बावन', 'तिरपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ',
  'साठ', 'इकसठ', 'बासठ', 'तिरसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सड़सठ', 'अड़सठ', 'उनहत्तर',
  'सत्तर', 'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उन्यासी',
  'अस्सी', 'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी',
  'नब्बे', 'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे',
];

/**
 * Convert a non-negative integer to its Hindi spoken form.
 * Supports up to 99,99,99,999 (Indian number system).
 */
function intToHindi(n) {
  if (n === 0) return ONES[0]; // शून्य
  if (n < 100) return ONES[n];

  const parts = [];

  // Crores (करोड़) — 10,000,000+
  if (n >= 10000000) {
    const crores = Math.floor(n / 10000000);
    parts.push(intToHindi(crores) + ' करोड़');
    n %= 10000000;
  }
  // Lakhs (लाख) — 100,000+
  if (n >= 100000) {
    const lakhs = Math.floor(n / 100000);
    parts.push(intToHindi(lakhs) + ' लाख');
    n %= 100000;
  }
  // Thousands (हज़ार) — 1,000+
  if (n >= 1000) {
    const thousands = Math.floor(n / 1000);
    parts.push(intToHindi(thousands) + ' हज़ार');
    n %= 1000;
  }
  // Hundreds (सौ) — 100+
  if (n >= 100) {
    const hundreds = Math.floor(n / 100);
    // "एक सौ" = 100, "दो सौ" = 200, just "सौ" for exactly 100 sounds natural too
    parts.push(hundreds === 1 ? 'एक सौ' : ONES[hundreds] + ' सौ');
    n %= 100;
  }
  // Remainder 1–99
  if (n > 0) {
    parts.push(ONES[n]);
  }

  return parts.join(' ');
}

/**
 * Convert a number string (possibly with decimal) to Hindi words.
 *   "75"    → "पचहत्तर"
 *   "25.5"  → "पच्चीस दशमलव पाँच"
 *   "1500"  → "एक हज़ार पाँच सौ"
 */
function numberStringToHindi(numStr) {
  if (numStr.includes('.')) {
    const [intPart, decPart] = numStr.split('.');
    const intHindi = intToHindi(parseInt(intPart, 10));
    // Read decimal digits individually
    const decHindi = decPart
      .split('')
      .map(d => ONES[parseInt(d, 10)])
      .join(' ');
    return intHindi + ' दशमलव ' + decHindi;
  }
  return intToHindi(parseInt(numStr, 10));
}

/**
 * Replace ALL Arabic digit sequences in a text string with their Hindi word equivalents.
 * Preserves surrounding text exactly.
 *
 * @param {string} text - Input text (may be Hindi/English mix)
 * @returns {string}    - Text with all numbers replaced by Hindi words
 */
export function replaceNumbersWithHindi(text) {
  if (!text) return text;
  // Match integers and decimals (e.g. 75, 1500, 25.5)
  return text.replace(/\d+(\.\d+)?/g, (match) => numberStringToHindi(match));
}
