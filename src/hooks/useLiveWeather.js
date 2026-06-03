import { useState, useEffect, useCallback } from 'react';
import { getSmartWeatherUpdates } from '../services/weatherService';

export const useLiveWeather = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refreshWeather = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const weatherData = await getSmartWeatherUpdates();
      
      setData(weatherData);
      setLastUpdated(Date.now());
    } catch (err) {
      console.error("Failed to fetch live weather telemetry:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Initial execution on mount
    refreshWeather();

    // 2. Background Daemon Interval (15 minutes = 900000 ms)
    const intervalId = setInterval(() => {
      refreshWeather();
    }, 15 * 60 * 1000);

    // 3. Tab Visibility Listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshWeather();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. Teardown / Cleanup
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshWeather]);

  return { data, loading, error, refreshWeather, lastUpdated };
};

export default useLiveWeather;
