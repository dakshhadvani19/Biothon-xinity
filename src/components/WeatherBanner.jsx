import React, { useState, useEffect } from 'react';
import { getFarmerCoordinates, fetchLocalWeatherAndAlerts } from '../services/weatherService';

export default function WeatherBanner() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchWeather = async () => {
      try {
        const coords = await getFarmerCoordinates();
        const data = await fetchLocalWeatherAndAlerts(coords.lat, coords.lon);
        
        if (isMounted) {
          setWeather(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching weather for banner:", err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchWeather();

    return () => {
      isMounted = false;
    };
  }, []);

  // API failure -> hide banner completely
  if (error) {
    return null;
  }

  // Loading phase -> skeleton pulse
  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto my-4 p-5 rounded-lg shadow-md bg-gray-200 animate-pulse flex items-center justify-center">
        <span className="text-gray-600 font-medium">Scanning local atmospheric conditions...</span>
      </div>
    );
  }

  // Fallback if data is empty despite no error
  if (!weather) {
    return null;
  }

  // Extreme Event Mode
  if (weather.isExtremeEvent) {
    return (
      <div className="w-full max-w-5xl mx-auto my-4 p-5 rounded-lg shadow-md bg-red-600 text-white flex flex-col md:flex-row items-center gap-4">
        <div className="text-4xl">⚠️</div>
        <div className="flex-1">
          <p className="font-bold text-lg md:text-xl uppercase tracking-wide">
            SEVERE WEATHER WARNING: Do not apply chemical treatments. Secure farm equipment.
          </p>
          {weather.alertMessage && (
            <p className="text-red-100 mt-1 font-medium">{weather.alertMessage}</p>
          )}
        </div>
      </div>
    );
  }

  // Imminent Rain Mode
  if (weather.isRainImminent) {
    return (
      <div className="w-full max-w-5xl mx-auto my-4 p-5 rounded-lg shadow-md bg-amber-500 text-black flex flex-col md:flex-row items-center gap-4">
        <div className="text-4xl">🌧️</div>
        <div className="flex-1">
          <p className="font-bold text-lg md:text-xl">
            High Probability of Rain. Do not spray pesticides today to prevent chemical runoff.
          </p>
          <p className="text-amber-900 mt-1 font-medium">
            Current: {weather.temp}°C | {weather.condition}
          </p>
        </div>
      </div>
    );
  }

  // Default Safe Mode
  return (
    <div className="w-full max-w-5xl mx-auto my-4 p-5 rounded-lg shadow-md bg-emerald-600 text-white flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="text-4xl">☀️</div>
        <div>
          <p className="font-bold text-lg md:text-xl">
            Optimal atmospheric conditions. Safe to apply treatments.
          </p>
          <p className="text-emerald-100 mt-1 font-medium">
            Current: {weather.temp}°C | {weather.condition}
          </p>
        </div>
      </div>
    </div>
  );
}
