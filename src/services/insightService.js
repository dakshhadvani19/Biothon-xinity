import { farmService } from './farmService';
import { diagnosticService } from './diagnosticService';
import { suitabilityService } from './suitabilityService';
import { nutritionService } from './nutritionService';
import { imageService } from './imageService';
import { aiService } from './aiService';

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractCropFromDisease(diseaseStr) {
    if (!diseaseStr) return 'Unknown';
    return diseaseStr.split('___')[0]
        .replace(/_/g, ' ').replace(/\(.*?\)/g, '').trim()
        .split(' ')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Weighted health score — 3 ranked factors:
 *   Rank 1 — overall suitability (weight 5): most important, AI-computed composite
 *   Rank 2 — temperature fit      (weight 3): how well current temp matches crop
 *   Rank 3 — soil/pH fit          (weight 2): soil type compatibility
 * Each factor normalized to 0-10 before weighting.
 * Disease confidence applies a penalty on top of the weighted base.
 */
function computeWeightedHealthScore(suitabilityScore, tempScore, soilScore, disease, confidence) {
    const suitNorm = suitabilityScore != null ? suitabilityScore / 10 : null;         // 0-100 → 0-10
    const tempNorm = tempScore != null ? (tempScore / 25) * 10 : null;                 // 0-25 → 0-10
    const soilNorm = soilScore != null ? (soilScore / 25) * 10 : null;                 // 0-25 → 0-10

    let score;
    if (suitNorm != null && tempNorm != null && soilNorm != null) {
        // Full 3-factor weighted average: weights sum to 10
        score = (suitNorm * 5 + tempNorm * 3 + soilNorm * 2) / 10;
    } else if (suitNorm != null) {
        score = suitNorm; // only suitability available
    } else {
        score = 7; // no analysis data — neutral default
    }

    // Disease penalty
    if (disease && !disease.toLowerCase().includes('healthy')) {
        const conf = confidence > 1 ? confidence / 100 : (confidence || 0);
        if (conf > 0.7) score -= 2;
        else if (conf > 0.4) score -= 1;
    }

    return Math.max(1, Math.min(10, Math.round(score)));
}

function getStatus(score, disease) {
    if (disease && !disease.toLowerCase().includes('healthy')) {
        const clean = (disease.split('___')[1] || 'Issue Detected').replace(/_/g, ' ');
        return { label: clean, color: score < 5 ? 'red' : 'amber' };
    }
    if (score >= 8) return { label: 'Healthy', color: 'green' };
    if (score >= 5) return { label: 'Needs Monitoring', color: 'amber' };
    return { label: 'At Risk', color: 'red' };
}

const SOIL_PH = {
    'Black Soil': '7.5–8.5',
    'Clay Soil': '6.0–7.5',
    'Sandy Loam': '5.5–6.5',
    'Red Soil': '5.5–7.5',
    'Alluvial Soil': '6.0–7.5',
};

// ── Cache ─────────────────────────────────────────────────────────────────────

const CACHE_TTL = 5 * 60 * 1000;
const cacheKey = (userId) => `agrishield_dashboard_v2_${userId}`;

function getCache(userId) {
    try {
        const raw = localStorage.getItem(cacheKey(userId));
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL) return null;
        return data;
    } catch { return null; }
}

function setCache(userId, data) {
    try {
        localStorage.setItem(cacheKey(userId), JSON.stringify({ data, ts: Date.now() }));
    } catch { /* storage full */ }
}

function updateCachedCard(userId, updatedCard) {
    try {
        const raw = localStorage.getItem(cacheKey(userId));
        if (!raw) return;
        const parsed = JSON.parse(raw);
        parsed.data = parsed.data.map(c => c.id === updatedCard.id ? updatedCard : c);
        localStorage.setItem(cacheKey(userId), JSON.stringify(parsed));
    } catch { /* ignore */ }
}

export function clearInsightCache(userId) {
    localStorage.removeItem(cacheKey(userId));
}

// ── Auto-fetch helpers ────────────────────────────────────────────────────────

// Prevents duplicate in-flight fetches for the same card
const pendingAutoFetches = new Set();

async function getCoords() {
    return new Promise(resolve => {
        if (!navigator.geolocation) {
            resolve({ lat: 22.3039, lon: 70.8022 });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            () => resolve({ lat: 22.3039, lon: 70.8022 }),
            { timeout: 3000 }
        );
    });
}

/**
 * For a card without suitability data, calls the AI backend, saves the result,
 * and returns the fully updated card. Returns the card with loadingCompatibility:false
 * on any failure so the loading state doesn't hang.
 */
async function autoFetchSuitability(card, userId, currentTemp, condition) {
    const key = `${userId}:${card.id}`;
    if (pendingAutoFetches.has(key)) return null;
    pendingAutoFetches.add(key);

    try {
        const coords = await getCoords();
        const result = await aiService.checkCropSuitability({
            crop_name: card.crop,
            lat: coords.lat,
            lon: coords.lon,
            soil_type: card.soil || '',
            current_temp: currentTemp || 0,
            current_condition: condition || 'Unknown',
        });

        if (result.not_in_database) {
            const updatedCard = {
                ...card,
                compatibility: 'N/A',
                summary: result.message || 'No specific weather/soil analysis available for this crop.',
                recommendations: [],
                hasFullAnalysis: true,
                loadingCompatibility: false
            };
            updateCachedCard(userId, updatedCard);
            return updatedCard;
        }

        // Persist to DB (fire-and-forget)
        suitabilityService.saveResult(userId, card.crop, card.soil || '', result).catch(() => { });

        const tempScore = result.sub_scores?.temperature?.score ?? null;
        const soilScore = result.sub_scores?.soil?.score ?? null;
        const healthScore = computeWeightedHealthScore(
            result.suitability_score,
            tempScore,
            soilScore,
            card._disease,
            card._diseaseConf
        );

        const updatedCard = {
            ...card,
            healthScore,
            status: getStatus(healthScore, card._disease || null),
            compatibility: result.suitable,
            pH: card.soil ? (SOIL_PH[card.soil] || '6.0–7.5') : '6.0–7.5',
            summary: result.weather_analysis?.slice(0, 140) || result.soil_analysis?.slice(0, 140) || card.summary,
            recommendations: result.recommendations?.slice(0, 2) || [],
            hasFullAnalysis: true,
            loadingCompatibility: false,
            _tempScore: tempScore,
            _soilScore: soilScore,
        };

        updateCachedCard(userId, updatedCard);
        return updatedCard;

    } catch {
        return { ...card, loadingCompatibility: false };
    } finally {
        pendingAutoFetches.delete(key);
    }
}

// ── Main aggregation ──────────────────────────────────────────────────────────

export const insightService = {
    /**
     * @param {string} userId
     * @param {{ currentTemp?: number, condition?: string, onCardUpdate?: (card) => void }} opts
     */
    async buildDashboardCards(userId, { currentTemp = null, condition = 'Unknown', onCardUpdate = null } = {}) {
        const cached = getCache(userId);
        if (cached) {
            // For any cached card that still lacks suitability, set loading state and re-fetch
            const pendingCards = cached.filter(c => !c.hasFullAnalysis);
            if (pendingCards.length > 0 && onCardUpdate) {
                const withLoading = cached.map(c =>
                    c.hasFullAnalysis ? c : { ...c, loadingCompatibility: true }
                );
                for (const card of pendingCards) {
                    autoFetchSuitability({ ...card, loadingCompatibility: true }, userId, currentTemp, condition)
                        .then(updated => { if (updated) onCardUpdate(updated); })
                        .catch(() => { });
                }
                return withLoading;
            }
            return cached;
        }

        // Parallel fetch all 5 sources
        const [farms, diagLogs, suitDocs, , images] = await Promise.all([
            farmService.getUserFarms(userId).catch(() => []),
            diagnosticService.getUserDiagnosticLogs(userId).catch(() => []),
            suitabilityService.getByUser(userId).catch(() => []),
            nutritionService.getByUser(userId).catch(() => []),
            imageService.getUserImages(userId).catch(() => []),
        ]);

        const cards = [];
        const tempDisplay = currentTemp != null ? `${currentTemp}°C` : '–';

        // ── Way 1: Registered farms ───────────────────────────────────────────
        for (const farm of farms) {
            const cropLower = farm.crop.toLowerCase();
            const suit = suitDocs.find(s => s.crop === cropLower) || null;
            const log = diagLogs.find(l =>
                extractCropFromDisease(l.disease).toLowerCase() === cropLower
            ) || null;
            const img = images.find(i => (i.crop_name || '').toLowerCase() === cropLower)
                || (log ? images.find(i => i.file_id === log.image_id) : null)
                || null;

            const healthScore = computeWeightedHealthScore(
                suit?.suitability_score ?? null,
                suit?.temp_score ?? null,
                suit?.soil_score ?? null,
                log?.disease ?? null,
                log?.confidence ?? 0
            );

            cards.push({
                id: farm.$id,
                way: 1,
                crop: farm.crop,
                soil: farm.soil,
                imageUrl: img?.image_url || null,
                healthScore,
                status: getStatus(healthScore, log?.disease || null),
                temperature: tempDisplay,
                pH: SOIL_PH[farm.soil] || '6.0–7.5',
                compatibility: suit?.suitable || null,
                summary: suit?.weather_analysis?.slice(0, 140)
                    || suit?.soil_analysis?.slice(0, 140)
                    || null,
                recommendations: suit?.recommendations?.slice(0, 2) || [],
                hasFullAnalysis: !!suit,
                loadingCompatibility: !suit,
                // Internal: carried forward for health score recomputation after auto-fetch
                _disease: log?.disease || null,
                _diseaseConf: log?.confidence ?? 0,
                _tempScore: suit?.temp_score ?? null,
                _soilScore: suit?.soil_score ?? null,
            });
        }

        // ── Way 2: Image-detected crops not already in farms ──────────────────
        const farmCrops = new Set(farms.map(f => f.crop.toLowerCase()));
        const logsByCrop = {};
        for (const log of diagLogs) {
            const cropDisplay = extractCropFromDisease(log.disease);
            const cropLower = cropDisplay.toLowerCase();
            if (farmCrops.has(cropLower)) continue;
            const existing = logsByCrop[cropLower];
            if (!existing || new Date(log.timestamp) > new Date(existing.timestamp)) {
                logsByCrop[cropLower] = { ...log, cropDisplay };
            }
        }

        for (const [cropLower, log] of Object.entries(logsByCrop)) {
            const suit = suitDocs.find(s => s.crop === cropLower) || null;
            const img = images.find(i => i.file_id === log.image_id) || null;
            const healthScore = computeWeightedHealthScore(
                suit?.suitability_score ?? null,
                suit?.temp_score ?? null,
                suit?.soil_score ?? null,
                log.disease,
                log.confidence
            );
            const diseasePart = log.disease.split('___')[1]?.replace(/_/g, ' ') || '';

            cards.push({
                id: log.$id,
                way: 2,
                crop: log.cropDisplay,
                soil: null,
                imageUrl: img?.image_url || null,
                healthScore,
                status: getStatus(healthScore, log.disease),
                temperature: tempDisplay,
                pH: suit ? '6.0–7.5' : '–',
                compatibility: suit?.suitable || null,
                summary: suit?.weather_analysis?.slice(0, 140)
                    || (diseasePart ? `Detected: ${diseasePart}` : null),
                recommendations: suit?.recommendations?.slice(0, 2) || [],
                hasFullAnalysis: !!suit,
                loadingCompatibility: !suit,
                _disease: log.disease,
                _diseaseConf: log.confidence ?? 0,
                _tempScore: suit?.temp_score ?? null,
                _soilScore: suit?.soil_score ?? null,
            });
        }

        setCache(userId, cards);

        // Kick off background auto-fetch for cards missing suitability
        if (onCardUpdate) {
            for (const card of cards) {
                if (!card.hasFullAnalysis) {
                    autoFetchSuitability(card, userId, currentTemp, condition)
                        .then(updated => { if (updated) onCardUpdate(updated); })
                        .catch(() => { });
                }
            }
        }

        return cards;
    },
};
