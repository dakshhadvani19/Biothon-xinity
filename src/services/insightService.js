import { farmService } from './farmService';
import { diagnosticService } from './diagnosticService';
import { suitabilityService } from './suitabilityService';
import { nutritionService } from './nutritionService';
import { imageService } from './imageService';

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

function computeHealthScore(suitabilityScore, disease, confidence) {
    let score = suitabilityScore != null ? Math.round(suitabilityScore / 10) : 7;
    if (disease && !disease.toLowerCase().includes('healthy')) {
        const conf = confidence > 1 ? confidence / 100 : (confidence || 0);
        if (conf > 0.7) score -= 2;
        else if (conf > 0.4) score -= 1;
    }
    return Math.max(1, Math.min(10, score));
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
const cacheKey = (userId) => `agrishield_dashboard_${userId}`;

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
    } catch { /* storage full — silently skip */ }
}

export function clearInsightCache(userId) {
    localStorage.removeItem(cacheKey(userId));
}

// ── Main aggregation ──────────────────────────────────────────────────────────

export const insightService = {
    async buildDashboardCards(userId, currentWeatherTemp = null) {
        const cached = getCache(userId);
        if (cached) return cached;

        // Parallel fetch all 5 sources
        const [farms, diagLogs, suitDocs, , images] = await Promise.all([
            farmService.getUserFarms(userId).catch(() => []),
            diagnosticService.getUserDiagnosticLogs(userId).catch(() => []),
            suitabilityService.getByUser(userId).catch(() => []),
            nutritionService.getByUser(userId).catch(() => []),
            imageService.getUserImages(userId).catch(() => []),
        ]);

        const cards = [];
        const tempDisplay = currentWeatherTemp != null ? `${currentWeatherTemp}°C` : '–';

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

            const healthScore = computeHealthScore(
                suit?.suitability_score ?? null,
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
            const healthScore = computeHealthScore(
                suit?.suitability_score ?? null,
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
            });
        }

        setCache(userId, cards);
        return cards;
    },
};
