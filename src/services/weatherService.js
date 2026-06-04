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

export const getFarmerCoordinates = () => {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.warn("Geolocation is not supported by this browser. Using default coordinates.");
            resolve({ lat: 22.3039, lon: 70.8022 }); // Rajkot, India
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
            },
            (error) => {
                console.warn("Location access denied or failed. Using default coordinates.", error);
                resolve({ lat: 22.3039, lon: 70.8022 });
            },
            { timeout: 10000 }
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
        if (data.forecast && data.forecast.forecastday) {
            const todayHours = data.forecast.forecastday[0]?.hour || [];
            const tomorrowHours = data.forecast.forecastday[1]?.hour || [];
            const combinedHours = [...todayHours, ...tomorrowHours];

            const currentEpoch = Math.floor(Date.now() / 1000);

            hourlyForecast = combinedHours
                .filter(hour => hour.time_epoch >= currentEpoch)
                .map(hour => ({
                    timestamp: hour.time,
                    temp: hour.temp_c,
                    rainChance: hour.chance_of_rain,
                    windSpeed: hour.wind_kph
                }));
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
export const getSmartWeatherUpdates = async () => {
    try {
        const coords = await getFarmerCoordinates();
        const currentTime = Date.now();

        const cachedLocStr = localStorage.getItem('agrishield_last_location');
        const cachedWeatherStr = localStorage.getItem('agrishield_last_weather');

        if (cachedLocStr && cachedWeatherStr) {
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
        const response = await fetch(import.meta.env.DEV ? 'http://localhost:8000/api/v1/agronomic-insights' : '/api/v1/agronomic-insights', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data: weatherData, farms: userFarms })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const payload = await response.json();
        
        if (payload && Array.isArray(payload.insights)) {
            return payload.insights;
        } else {
            throw new Error("Invalid format");
        }
    } catch (error) {
        console.error("🛑 FRONTEND BRIDGE EXCEPTION:", error);
        return [
            "AI operational parameters are syncing with regional crop coordinates.",
            "Maintain baseline soil moisture checking schedules across standing plots.",
            "Verify secondary irrigation equipment functionality."
        ];
    }
}
