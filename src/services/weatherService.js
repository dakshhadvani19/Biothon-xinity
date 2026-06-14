export const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

// 1. Geospatial Math (Haversine Formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export const getFarmerCoordinates = (forceFresh = false) => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.warn("Geolocation is not supported by this browser. Using default coordinates.");
            resolve({ lat: 22.3039, lon: 70.8022 }); // Rajkot, India
            return;
        }

        // FAANG technique: Optimistic local cache return for instant UI loading
        if (!forceFresh) {
            const cachedLocStr = localStorage.getItem('agrishield_last_location');
            if (cachedLocStr) {
                try {
                    const cachedLoc = JSON.parse(cachedLocStr);
                    // Consider cache fresh if less than 1 hour old
                    const isFresh = (Date.now() - cachedLoc.timestamp) < 60 * 60 * 1000;
                    if (isFresh && cachedLoc.lat && cachedLoc.lon) {
                        resolve({ lat: cachedLoc.lat, lon: cachedLoc.lon });
                        return; // Early return for 0ms latency
                    }
                } catch (e) {
                    console.error("Cache parse error", e);
                }
            }
        }

        // Fast low-accuracy IP/WiFi-based location request
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                // Preemptively cache to localStorage for future instant loads
                localStorage.setItem('agrishield_last_location', JSON.stringify({
                    ...coords,
                    timestamp: Date.now()
                }));
                resolve(coords);
            },
            (error) => {
                console.warn("Location access denied or failed. Falling back.", error);
                // Fallback to stale cache if available, otherwise default
                const cachedLocStr = localStorage.getItem('agrishield_last_location');
                if (cachedLocStr) {
                    try {
                        const cachedLoc = JSON.parse(cachedLocStr);
                        if (cachedLoc.lat && cachedLoc.lon) {
                            resolve({ lat: cachedLoc.lat, lon: cachedLoc.lon });
                            return;
                        }
                    } catch (e) {}
                }
                resolve({ lat: 22.3039, lon: 70.8022 });
            },
            { 
                enableHighAccuracy: false, // Don't wake up GPS hardware, use fast WiFi/IP positioning
                maximumAge: 300000,        // Accept 5-minute-old browser-cached position
                timeout: 5000              // Fail fast (5s) instead of waiting forever (10s)
            }
        );
    });
};

// 2. Enhanced Weather Fetching & Deep Parsing Logic
export const fetchLocalWeatherAndAlerts = async (lat, lon) => {
    try {
        const url = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${lat},${lon}&alerts=yes&days=2`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Weather API returned status: ${response.status}`);
        }

        const data = await response.json();

        const currentTemp = data.current?.temp_c || 0;
        const condition = data.current?.condition?.text || "Unknown";

        // Combine today and tomorrow's hourly forecast
        let hourlyForecast = [];
        let fullHourlyData = [];
        if (data.forecast && data.forecast.forecastday) {
            const todayHours = data.forecast.forecastday[0]?.hour || [];
            const tomorrowHours = data.forecast.forecastday[1]?.hour || [];
            const combinedHours = [...todayHours, ...tomorrowHours];

            const currentEpoch = Math.floor(Date.now() / 1000);

            fullHourlyData = combinedHours.map(hour => ({
                timestamp: hour.time,
                time_epoch: hour.time_epoch,
                temp: hour.temp_c,
                rainChance: hour.chance_of_rain,
                windSpeed: hour.wind_kph
            }));

            hourlyForecast = fullHourlyData.filter(hour => hour.time_epoch >= currentEpoch);
        }

        const alerts = data.alerts?.alert || [];

        // Legacy mapping fields to ensure WeatherBanner component doesn't break
        const isExtremeEvent = alerts.length > 0;
        const isRainImminent = hourlyForecast.length > 0 ? hourlyForecast[0].rainChance > 50 : false;
        const alertMessage = isExtremeEvent ? alerts[0].event : null;

        let sprayRecommendation = "Safe to apply treatments.";
        if (isExtremeEvent) {
            sprayRecommendation = "⚠️ SEVERE WEATHER WARNING: Secure farm.";
        } else if (isRainImminent) {
            sprayRecommendation = "Do not spray due to high rain probability.";
        }

        return {
            currentTemp,
            condition,
            hourlyForecast,
            fullHourlyData,
            alerts,
            // Preserved fields for backward compatibility with older UI components
            temp: currentTemp,
            isRainImminent,
            isExtremeEvent,
            alertMessage,
            sprayRecommendation
        };

    } catch (error) {
        console.error("Failed to fetch local weather data:", error);
        return {
            currentTemp: 0,
            condition: "Unavailable",
            hourlyForecast: [],
            fullHourlyData: [],
            alerts: [],
            temp: 0,
            isRainImminent: false,
            isExtremeEvent: false,
            alertMessage: null,
            sprayRecommendation: "Weather data unavailable. Exercise caution before applying treatments."
        };
    }
};

// 3. Caching & Geofencing Wrapper
export const getSmartWeatherUpdates = async (forceFresh = false) => {
    try {
        const coords = await getFarmerCoordinates(forceFresh);
        const currentTime = Date.now();

        const cachedLocStr = localStorage.getItem('agrishield_last_location');
        const cachedWeatherStr = localStorage.getItem('agrishield_last_weather');

        if (!forceFresh && cachedLocStr && cachedWeatherStr) {
            const cachedLoc = JSON.parse(cachedLocStr);
            const cachedWeather = JSON.parse(cachedWeatherStr);

            const distanceMoved = calculateDistance(coords.lat, coords.lon, cachedLoc.lat, cachedLoc.lon);
            const minutesSinceLastUpdate = (currentTime - cachedWeather.timestamp) / (1000 * 60);

            // If distance < 5km AND data is fresh (< 60 mins), immediately return cache to save bandwidth
            if (distanceMoved < 5 && minutesSinceLastUpdate < 60) {
                return cachedWeather.data;
            }
        }

        // Geofence or Time cache missed, fetch fresh data
        const freshData = await fetchLocalWeatherAndAlerts(coords.lat, coords.lon);

        // ... (Line 141) const freshData = await fetchLocalWeatherAndAlerts(...)


        // Update cache
        localStorage.setItem('agrishield_last_location', JSON.stringify({
            lat: coords.lat,
            lon: coords.lon,
            timestamp: currentTime
        }));

        localStorage.setItem('agrishield_last_weather', JSON.stringify({
            data: freshData,
            timestamp: currentTime
        }));

        return freshData;
    } catch (error) {
        console.error("Smart caching wrapper failed:", error);
        return {
            currentTemp: 0,
            condition: "Unavailable",
            hourlyForecast: [],
            alerts: [],
            temp: 0,
            isRainImminent: false,
            isExtremeEvent: false,
            alertMessage: null,
            sprayRecommendation: "Weather tracking unavailable. Please check local forecasts."
        };
    }
};

export async function fetchAIInsights(weatherData, userFarms = []) {
    try {
        // --- 1. FAANG Optimistic Caching Layer (0ms Load Time) ---
        const cacheKey = 'agrishield_insights_cache';
        const cacheTimeKey = 'agrishield_insights_time';
        const cachedStr = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(cacheTimeKey);
        const currentTime = Date.now();

        // Use cached insights if less than 60 minutes old
        if (cachedStr && cachedTime && (currentTime - parseInt(cachedTime)) < 60 * 60 * 1000) {
            return JSON.parse(cachedStr);
        }

        const ML_ENGINE = (import.meta.env.VITE_ML_ENGINE_URL || 'https://dakshhadvani19-agrishield.hf.space');
        
        // --- 2. Hard Timeout Layer (Max 4.5 Seconds) ---
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);

        const response = await fetch(`${ML_ENGINE}/api/v1/agronomic-insights`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: weatherData, farms: userFarms }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const payload = await response.json();
        
        let finalInsights;
        if (payload && (payload.insights_en || payload.insights_hi)) {
            finalInsights = {
                insights_en: payload.insights_en || [],
                insights_hi: payload.insights_hi || [],
            };
        } else if (payload && Array.isArray(payload.insights)) {
            finalInsights = { insights_en: payload.insights, insights_hi: [] };
        } else {
            throw new Error("Invalid format");
        }

        // --- 3. Save to Cache ---
        localStorage.setItem(cacheKey, JSON.stringify(finalInsights));
        localStorage.setItem(cacheTimeKey, currentTime.toString());

        return finalInsights;
    } catch (error) {
        console.error("🛑 FRONTEND BRIDGE EXCEPTION:", error);
        
        // --- 4. Smart Fallbacks on Timeout (< 5 Seconds Guarantee) ---
        let fallbackEn = ["Maintain routine monitoring of soil moisture levels based on local conditions."];
        let fallbackHi = ["स्थानीय परिस्थितियों के आधार पर मिट्टी की नमी के स्तर की नियमित निगरानी बनाए रखें।"];
        
        if (weatherData?.currentTemp > 35) {
            fallbackEn = ["Extreme heat detected. Increase irrigation frequency to prevent heat stress on crops.", "Deploy shade nets if possible for highly vulnerable seedling beds."];
            fallbackHi = ["अत्यधिक गर्मी का पता चला है। फसलों को गर्मी के तनाव से बचाने के लिए सिंचाई बढ़ाएं।", "अत्यधिक संवेदनशील पौधों के लिए यदि संभव हो तो शेड नेट का उपयोग करें।"];
        } else if (weatherData?.isRainImminent || weatherData?.condition?.toLowerCase().includes('rain')) {
            fallbackEn = ["Rain is imminent. Delay any scheduled pesticide or foliar fertilizer spraying to prevent chemical runoff.", "Ensure field drainage channels are clear to prevent waterlogging in root zones."];
            fallbackHi = ["बारिश की संभावना है। रसायनों को बहने से रोकने के लिए कीटनाशक या उर्वरक के छिड़काव में देरी करें।", "जड़ों में जलभराव को रोकने के लिए खेत के जल निकासी चैनलों को साफ रखें।"];
        } else if (weatherData?.currentTemp < 10) {
            fallbackEn = ["Cold temperatures detected. Consider light evening irrigation to protect root zones from frost damage."];
            fallbackHi = ["ठंडे तापमान का पता चला है। पाले से बचाव के लिए शाम को हल्की सिंचाई करने पर विचार करें।"];
        }

        return {
            insights_en: fallbackEn,
            insights_hi: fallbackHi
        };
    }
}
