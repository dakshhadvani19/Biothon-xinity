import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, CloudRain, Wind, Thermometer, Clock, Target, Lightbulb } from 'lucide-react';
import useLiveWeather from '../hooks/useLiveWeather';
import { fetchAIInsights } from '../services/weatherService';
import WeatherBanner from '../components/WeatherBanner';

export default function UpdatesDashboard() {
  const { data, loading, error, refreshWeather, lastUpdated } = useLiveWeather();
  const [insights, setInsights] = useState([]);
  const [isInsightsLoading, setIsInsightsLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      if (data) {
        setIsInsightsLoading(true);
        try {
          const dynamicInsights = await fetchAIInsights(data);
          setInsights(dynamicInsights);
        } finally {
          setIsInsightsLoading(false);
        }
      }
    };
    fetchInsights();
  }, [data]);

  const formatTime = (epoch) => {
    return new Date(epoch).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastUpdated = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (loading && !data) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6 animate-pulse p-4">
        <div className="h-32 bg-gray-200 rounded-2xl w-full"></div>
        <div className="h-16 bg-gray-200 rounded-xl w-full"></div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="min-w-[140px] h-40 bg-gray-200 rounded-2xl shrink-0"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 bg-red-50 text-red-700 rounded-2xl text-center border border-red-200 mt-4">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-bold mb-2">Telemetry Offline</h2>
        <p>Failed to load weather data. Please check your connection.</p>
        <button onClick={refreshWeather} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
          Retry Connection
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12 mt-4">
      <WeatherBanner />
      {/* Header Section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner">
            <Thermometer className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              {data.currentTemp}°C
            </h1>
            <p className="text-xl font-medium text-gray-500 mt-1">{data.condition}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-center md:items-end gap-3">
          <button 
            onClick={refreshWeather}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Syncing...' : 'Force Sync'}
          </button>
          <div className="flex items-center gap-1.5 text-sm text-gray-400 font-medium">
            <Clock className="w-4 h-4" />
            Last Updated: {formatLastUpdated(lastUpdated)}
          </div>
        </div>
      </div>

      {/* Critical Alerts Section */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 px-1">Active Threat Intelligence</h2>
          {data.alerts.map((alert, idx) => (
            <div key={idx} className="bg-red-600 text-white rounded-2xl p-6 shadow-[0_0_25px_rgba(220,38,38,0.4)] animate-pulse border-2 border-red-400">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-8 h-8 shrink-0 mt-1 text-red-200" />
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-wide mb-2">{alert.event}</h3>
                  <p className="text-red-50 text-sm md:text-base leading-relaxed opacity-90 whitespace-pre-wrap">
                    {alert.desc || alert.headline}
                  </p>
                  <div className="mt-4 inline-block bg-red-900/50 px-4 py-2 rounded-lg text-sm font-bold border border-red-500/50">
                    SEVERITY: {alert.severity || 'EXTREME'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 48-Hour Forecast Timeline */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          48-Hour Atmospheric Forecast
        </h2>
        
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x relative">
          {data.hourlyForecast.map((hour, idx) => {
            const isImminentRain = hour.rainChance > 50;
            return (
              <div 
                key={idx} 
                className={`min-w-[140px] snap-start shrink-0 rounded-2xl p-5 border flex flex-col items-center text-center transition-all ${
                  isImminentRain 
                    ? 'bg-blue-50 border-blue-200 shadow-sm' 
                    : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                }`}
              >
                <div className="text-gray-500 text-sm font-bold mb-3">
                  {formatTime(hour.timestamp)}
                </div>
                <div className="text-3xl font-black text-gray-900 mb-4">
                  {hour.temp}°
                </div>
                
                <div className="w-full space-y-2">
                  <div className={`flex items-center justify-center gap-1.5 text-sm font-bold ${isImminentRain ? 'text-blue-600' : 'text-gray-400'}`}>
                    <CloudRain className="w-4 h-4" />
                    {hour.rainChance}%
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-gray-400">
                    <Wind className="w-4 h-4" />
                    {hour.windSpeed}kph
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Agronomic Intelligence Advisory */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-6 shadow-sm mt-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          AI Agronomic Intelligence Advisory
        </h2>
        
        {isInsightsLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((insight, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-100 dark:border-gray-700/50 flex items-start gap-3">
                <span className="text-green-500 font-bold shrink-0">✓</span>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {insight}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
