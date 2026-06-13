import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sprout, MapPin, Thermometer, Cloud, CheckCircle2, 
  AlertTriangle, Send, MessageSquare, 
  Calendar, RefreshCw, Sparkles, BookOpen,
  BarChart3, Eye, Info
} from 'lucide-react';
import { getFarmerCoordinates, getSmartWeatherUpdates } from '../services/weatherService';
import { aiService } from '../services/aiService';
import { suitabilityService } from '../services/suitabilityService';
import { useAuth } from '../context/AuthContext';
import HindiVoicePlayer from '../components/HindiVoicePlayer';

export default function TryNewCrop() {
  const { user } = useAuth();
  // Form inputs
  const [cropName, setCropName] = useState('');
  const [soilType, setSoilType] = useState('Black Soil');
  const [customSoil, setCustomSoil] = useState('');

  // Live context (weather and location)
  const [coords, setCoords] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [isSyncingLocation, setIsSyncingLocation] = useState(false);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  // Inline chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatEndRef = useRef(null);

  // Standard soil options
  const soilOptions = [
    'Black Soil',
    'Clay Soil',
    'Sandy Loam',
    'Red Soil',
    'Alluvial Soil',
    'Other (Specify)'
  ];

  // Load weather and location context on mount
  useEffect(() => {
    syncLocationAndWeather();
  }, []);

  // Scroll inline chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const syncLocationAndWeather = async () => {
    setIsSyncingLocation(true);
    try {
      const position = await getFarmerCoordinates();
      setCoords(position);
      
      const weather = await getSmartWeatherUpdates();
      setWeatherData(weather);
    } catch (err) {
      console.error("Location/Weather syncing failed:", err);
    } finally {
      setIsSyncingLocation(false);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!cropName.trim()) {
      setError("Please specify the name of the plant/crop.");
      return;
    }

    setError(null);
    setAnalysisResult(null);
    setChatMessages([]);

    // Proceed with actual analysis
    setIsAnalyzing(true);

    const finalSoil = soilType === 'Other (Specify)' ? customSoil : soilType;
    const finalCoords = coords || { lat: 22.3039, lon: 70.8022 }; // Rajkot fallback

    try {
      const payload = {
        crop_name: cropName,
        lat: finalCoords.lat,
        lon: finalCoords.lon,
        soil_type: finalSoil,
        current_temp: weatherData?.currentTemp || 0,
        current_condition: weatherData?.condition || 'Unknown',
      };

      const result = await aiService.checkCropSuitability(payload);

      // Handle "not in knowledge base" response
      if (result.not_in_database) {
        setError(result.message || `'${cropName}' is not in our knowledge base. Please try another crop.`);
        setIsAnalyzing(false);
        return;
      }

      setAnalysisResult(result);

      // Fire-and-forget save to DB — powers the dashboard cards
      if (user) {
        suitabilityService.saveResult(user.$id, cropName, finalSoil, result).catch(() => {});
      }

      // Initialize inline chat with a greeting
      setChatMessages([
        {
          role: 'assistant',
          content: `Hello! I have completed the suitability report for growing **${result.crop_display_name || cropName}** on your **${finalSoil}** land in **${result.region_name || 'your region'}**. The analysis suggests it is **${result.suitable}** with a compatibility rating of **${result.suitability_score}/100**. \n\nHow can I assist you with planting preparations or crop management suggestions?`
        }
      ]);
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Analysis connection failed. Make sure the backend server is running.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // buildHindiSummary removed — HindiVoicePlayer now uses backend hindi_narration directly

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingChat) return;

    const userMessageText = chatInput;
    setChatInput('');
    
    // Add user message locally
    const updatedMessages = [...chatMessages, { role: 'user', content: userMessageText }];
    setChatMessages(updatedMessages);
    setIsSendingChat(true);

    try {
      // Build conversation context payload
      const finalSoil = soilType === 'Other (Specify)' ? customSoil : soilType;
      const chatContext = {
        crop_name: cropName,
        soil_type: finalSoil,
        location: coords || { lat: 22.3039, lon: 70.8022 },
        weather: weatherData ? { temp: weatherData.currentTemp, cond: weatherData.condition } : null,
        suitability_rating: analysisResult?.suitable,
        compatibility_score: analysisResult?.suitability_score
      };

      const response = await aiService.sendChatMessage(updatedMessages, chatContext);
      
      const contentEn = response.content_en || response.content || '';
      const contentHi = response.content_hi || '';
      setChatMessages(prev => [...prev, { role: 'assistant', content: contentEn, content_hi: contentHi }]);
    } catch (err) {
      console.error("Chat message error:", err);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I am having trouble connecting to the advisory server. Please check your network." 
      }]);
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 mt-12 md:mt-20 pb-16 px-4 sm:px-0">
      {/* Header section */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white flex items-center gap-4 tracking-tight drop-shadow-sm">
            <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-3 rounded-2xl shadow-[0_0_20px_rgba(52,211,153,0.3)] text-white">
              <Sprout className="w-6 h-6" />
            </div>
            Try New Crop Advisor
          </h1>
          <p className="text-emerald-100/70 mt-3 text-lg font-medium max-w-2xl">
            Verify if a new plant is suitable for your specific soil type and seasonal weather.
          </p>
        </div>

        {/* Geolocation status badge */}
        <div className="bg-emerald-950/60 backdrop-blur-md border border-emerald-700/50 rounded-2xl px-5 py-3 shadow-lg flex items-center gap-4 self-start md:self-auto">
          <div className="bg-emerald-500/20 p-2.5 rounded-full text-emerald-400 animate-pulse border border-emerald-500/30">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs text-emerald-400/80 font-bold uppercase tracking-wider mb-0.5">Present Location</div>
            <div className="text-sm font-semibold text-emerald-50 flex items-center gap-2">
              {isSyncingLocation ? (
                <span className="text-emerald-400/60 font-normal">Detecting GPS...</span>
              ) : coords ? (
                <span>{coords.lat.toFixed(4)}, {coords.lon.toFixed(4)} {weatherData ? `(${weatherData.currentTemp}°C)` : ''}</span>
              ) : (
                <span className="text-amber-400 font-medium">Rajkot, India (Default)</span>
              )}
              <button 
                onClick={syncLocationAndWeather} 
                disabled={isSyncingLocation}
                className="text-emerald-400/50 hover:text-emerald-300 transition-colors ml-1 p-1 hover:bg-emerald-800/50 rounded-lg"
                title="Sync Location"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLocation ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main input form panel */}
      <section className="bg-emerald-950/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-500/20 p-8 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <form onSubmit={handleAnalyze} className="space-y-8 relative z-10">
          <div className="flex flex-col gap-8 max-w-2xl mx-auto">
            
            {/* Inputs */}
            <div className="space-y-8 relative z-10">
              <div>
                <label htmlFor="crop-name" className="block text-sm font-bold text-emerald-100 mb-3 tracking-wide">
                  What plant/crop would you like to try?
                </label>
                <div className="relative">
                  <input
                    id="crop-name"
                    type="text"
                    required
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    placeholder="e.g. Soybeans, Dragon Fruit, Chickpeas..."
                    className="w-full bg-emerald-900/40 border border-emerald-600/30 rounded-2xl px-6 py-4 pl-14 focus:ring-2 focus:ring-green-400/50 focus:border-green-400 focus:bg-emerald-900/60 outline-none transition-all text-white font-medium placeholder-emerald-400/40 shadow-inner"
                  />
                  <Sparkles className="w-5 h-5 text-emerald-400/60 absolute left-5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-emerald-100 mb-3 tracking-wide">
                  What is the soil type of your plot?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {soilOptions.map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSoilType(option)}
                      className={`py-3.5 px-4 rounded-xl border text-sm font-bold transition-all duration-300 text-center backdrop-blur-sm ${
                        soilType === option
                          ? 'border-green-400 bg-green-500/20 text-green-300 shadow-[0_0_15px_rgba(74,222,128,0.15)]'
                          : 'border-emerald-700/50 text-emerald-300/70 hover:border-emerald-500/80 hover:bg-emerald-800/40 hover:text-emerald-200'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                {soilType === 'Other (Specify)' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3"
                  >
                    <input
                      type="text"
                      required
                      value={customSoil}
                      onChange={(e) => setCustomSoil(e.target.value)}
                      placeholder="Specify soil type (e.g., Sandy Silt loam)"
                      className="w-full bg-emerald-900/40 border border-emerald-600/30 rounded-xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400 focus:bg-emerald-900/60 transition-all text-sm font-medium text-white placeholder-emerald-400/40"
                    />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="relative z-10">
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 35px rgba(52,211,153,0.5)" }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                type="submit"
                disabled={isAnalyzing}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold text-lg py-4 px-6 rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50 mt-4 flex items-center justify-center gap-3 border border-green-400/40 relative overflow-hidden group"
              >
                {/* Premium shine effect */}
                <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform skew-x-[-20deg] group-hover:left-[200%] transition-all duration-1000 ease-in-out pointer-events-none" />
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin relative z-10" />
                    <span className="relative z-10">Crunching Climate Telemetry...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 relative z-10 group-hover:scale-125 transition-transform duration-300" />
                    <span className="relative z-10 drop-shadow-md">Analyze Suitability</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-6 bg-red-900/40 border border-red-500/50 text-red-200 rounded-2xl p-4 text-sm font-semibold flex items-center gap-3 backdrop-blur-sm shadow-lg max-w-2xl mx-auto">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
            {error}
          </div>
        )}
      </section>

      {/* Analysis Results Display */}
      <AnimatePresence mode="wait">
        {/* Loading Scanning Animation Overlay */}
        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-emerald-950/40 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-12 shadow-2xl flex flex-col items-center justify-center space-y-6 relative overflow-hidden"
          >
            <motion.div 
              animate={{ y: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-full h-1.5 bg-green-400 shadow-[0_0_20px_rgba(74,222,128,0.8)] absolute top-0 left-0"
            />
            <div className="relative">
              <div className="w-20 h-20 bg-emerald-900/50 rounded-full flex items-center justify-center text-green-400 border border-emerald-500/30">
                <Sprout className="w-10 h-10 animate-bounce shadow-green-400/50" />
              </div>
              <div className="absolute inset-0 border-4 border-green-500/20 border-t-green-400 rounded-full animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white drop-shadow-md">Assessing Crop Viability</h3>
              <p className="text-emerald-200/70 max-w-sm font-medium">
                Correlating region's latitude and longitude with global thermal constraints, annual rainfall profiles, and current soil conditions...
              </p>
            </div>
          </motion.div>
        )}

        {/* Actual Report Display */}
        {analysisResult && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 relative z-10"
          >
            {/* Hindi Voice Player - full report mode */}
            <div className="flex justify-end">
              <HindiVoicePlayer
                hindiText={analysisResult.hindi_narration}
                label={`${analysisResult.crop_display_name || cropName} - उपयुक्तता रिपोर्ट`}
              />
            </div>
            <div className="bg-emerald-950/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-emerald-500/20 shadow-2xl grid grid-cols-1 md:grid-cols-3 gap-8 relative overflow-hidden">
              <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
              {/* Suitability Radial Gauge */}
              <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-emerald-800/40 pb-6 md:pb-0 md:pr-8 text-center relative z-10">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_10px_rgba(74,222,128,0.1)]">
                    <circle 
                      cx="80" 
                      cy="80" 
                      r="65" 
                      className="text-emerald-900/60" 
                      strokeWidth="10" 
                      stroke="currentColor" 
                      fill="transparent" 
                    />
                    <motion.circle 
                      cx="80" 
                      cy="80" 
                      r="65" 
                      className={`${ 
                        analysisResult.suitability_score >= 80 
                          ? 'text-green-400' 
                          : analysisResult.suitability_score >= 50 
                            ? 'text-amber-400' 
                            : 'text-red-400'
                      }`} 
                      strokeWidth="10" 
                      strokeDasharray="408.4"
                      initial={{ strokeDashoffset: 408.4 }}
                      animate={{ strokeDashoffset: 408.4 - (408.4 * analysisResult.suitability_score) / 100 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      strokeLinecap="round"
                      stroke="currentColor" 
                      fill="transparent" 
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-extrabold text-white">{analysisResult.suitability_score}%</span>
                    <span className="text-xs text-emerald-400/80 font-bold uppercase tracking-wider mb-0.5">Compatibility</span>
                  </div>
                </div>

                <div className="mt-5 space-y-1">
                  <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold shadow-lg backdrop-blur-md ${
                    analysisResult.suitable === 'Highly Suitable'
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : analysisResult.suitable === 'Moderately Suitable'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {analysisResult.suitable}
                  </span>
                  <p className="text-xs text-emerald-400/60 mt-2 font-medium">Crop: <span className="text-emerald-200 font-bold">{analysisResult.crop_display_name || cropName}</span></p>
                  {analysisResult.region_name && (
                    <p className="text-xs text-emerald-400/50 font-medium">Region: <span className="text-emerald-300">{analysisResult.region_name}</span></p>
                  )}
                  {analysisResult.data_source === 'knowledge_base' && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-green-400/80 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full mt-1">
                      <Info className="w-2.5 h-2.5" /> Verified Knowledge Base
                    </span>
                  )}
                </div>
              </div>

              {/* Compatibility Details (Weather, Soil, Climate) */}
              <div className="md:col-span-2 space-y-6 relative z-10">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-4">
                    <div className="bg-emerald-900/60 p-2 rounded-xl border border-emerald-700/50"><BookOpen className="w-5 h-5 text-green-400" /></div>
                    Scientific Suitability Breakdown
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-emerald-900/30 border border-emerald-700/30 rounded-2xl p-4 flex gap-3.5 items-start backdrop-blur-sm">
                    <div className="bg-blue-500/20 p-2.5 rounded-xl text-blue-300 shrink-0 border border-blue-500/20">
                      <Thermometer className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-100">Atmospheric Feasibility</h4>
                      <p className="text-xs text-emerald-200/60 mt-1 leading-relaxed">{analysisResult.weather_analysis}</p>
                    </div>
                  </div>

                  <div className="bg-emerald-900/30 border border-emerald-700/30 rounded-2xl p-4 flex gap-3.5 items-start backdrop-blur-sm">
                    <div className="bg-amber-500/20 p-2.5 rounded-xl text-amber-300 shrink-0 border border-amber-500/20">
                      <Sprout className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-100">Soil Condition Fit</h4>
                      <p className="text-xs text-emerald-200/60 mt-1 leading-relaxed">{analysisResult.soil_analysis}</p>
                    </div>
                  </div>

                  <div className="bg-emerald-900/30 border border-emerald-700/30 rounded-2xl p-4 sm:col-span-2 flex gap-3.5 items-start backdrop-blur-sm">
                    <div className="bg-green-500/20 p-2.5 rounded-xl text-green-300 shrink-0 border border-green-500/20">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-100">Yearly & Seasonal Climate Trend</h4>
                      <p className="text-xs text-emerald-200/60 mt-1 leading-relaxed">{analysisResult.yearly_climate_analysis}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-scores Breakdown Panel — NEW */}
            {analysisResult.sub_scores && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-emerald-950/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-emerald-500/20 shadow-2xl"
              >
                <h3 className="text-lg font-bold text-white flex items-center gap-3 mb-5">
                  <div className="bg-blue-500/20 p-1.5 rounded-lg border border-blue-500/30"><BarChart3 className="w-5 h-5 text-blue-400" /></div>
                  Factor-by-Factor Score Breakdown
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(analysisResult.sub_scores).map(([factor, data]) => {
                    const factorLabels = { temperature: '🌡️ Temperature', soil: '🪨 Soil', rainfall: '🌧️ Rainfall', season: '📅 Season' };
                    const pct = (data.score / 25) * 100;
                    const barColor = pct >= 80 ? 'bg-green-400' : pct >= 52 ? 'bg-amber-400' : 'bg-red-400';
                    const statusColor = data.status === 'excellent' ? 'text-green-300' : data.status === 'good' ? 'text-blue-300' : data.status === 'moderate' ? 'text-amber-300' : data.status === 'poor' ? 'text-orange-400' : 'text-red-400';
                    return (
                      <div key={factor} className="bg-emerald-900/30 border border-emerald-700/30 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-100">{factorLabels[factor] || factor}</span>
                          <span className={`text-xs font-bold uppercase ${statusColor}`}>{data.status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-emerald-900/60 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                              className={`h-full ${barColor} rounded-full shadow-[0_0_8px_rgba(74,222,128,0.3)]`}
                            />
                          </div>
                          <span className="text-xs font-bold text-white w-8 text-right">{data.score}/25</span>
                        </div>
                        <p className="text-[10px] text-emerald-300/60 leading-relaxed line-clamp-3">{data.reason}</p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Removed Image Analysis Result box */}

            {/* Recommendations & Warnings Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-emerald-950/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-emerald-500/20 shadow-2xl space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-3 border-b border-emerald-800/50 pb-4">
                  <div className="bg-green-500/20 p-1.5 rounded-lg border border-green-500/30"><CheckCircle2 className="w-5 h-5 text-green-400" /></div>
                  Cultivation Recommendations
                </h3>
                <ul className="space-y-3 mt-2">
                  {analysisResult.recommendations?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-emerald-100/80">
                      <span className="text-green-400 font-bold shrink-0 mt-0.5">✓</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-emerald-950/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-emerald-500/20 shadow-2xl space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-3 border-b border-emerald-800/50 pb-4">
                  <div className="bg-amber-500/20 p-1.5 rounded-lg border border-amber-500/30"><AlertTriangle className="w-5 h-5 text-amber-400" /></div>
                  Necessary Precautions
                </h3>
                <ul className="space-y-3 mt-2">
                  {analysisResult.precautions?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-emerald-100/80">
                      <span className="text-amber-400 font-bold shrink-0 mt-0.5">⚠️</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* INTEGRATED ADVISORY CHAT ON THE SAME PAGE */}
            <div className="bg-emerald-950/50 backdrop-blur-xl text-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-500/20">
              <div className="p-6 border-b border-emerald-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-800/60 p-2.5 rounded-xl border border-emerald-700/50">
                    <MessageSquare className="w-5 h-5 text-green-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">Agronomic Expert Chat Advisor</h3>
                    <p className="text-xs text-emerald-300/70 mt-0.5">Discuss planting instructions and ask follow-up agronomic questions.</p>
                  </div>
                </div>
                <div className="bg-emerald-800/60 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-200 border border-emerald-700/50 shadow-inner">
                  Focus: {cropName}
                </div>
              </div>

              {/* Chat Message Thread */}
              <div className="h-80 overflow-y-auto p-6 space-y-4 bg-emerald-950/30">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-br-none shadow-[0_0_15px_rgba(34,197,94,0.15)] border border-green-400/30' 
                          : 'bg-emerald-900/60 border border-emerald-700/50 text-emerald-50 rounded-bl-none shadow-lg whitespace-pre-wrap'
                      }`}
                    >
                      {msg.content}
                      {msg.role === 'assistant' && msg.content_hi && (
                        <HindiVoicePlayer
                          hindiText={msg.content_hi}
                          label="AI सलाह"
                          compact
                        />
                      )}
                    </div>
                  </div>
                ))}
                {isSendingChat && (
                  <div className="flex justify-start">
                    <div className="bg-emerald-900/60 border border-emerald-700/50 rounded-2xl rounded-bl-none px-5 py-3.5 text-sm text-emerald-300 flex items-center gap-2 shadow-lg">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="ml-1">AI is typing...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Field */}
              <form onSubmit={handleSendChat} className="p-4 bg-emerald-950/80 border-t border-emerald-800/50 flex gap-3 backdrop-blur-md">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Ask a question about growing ${cropName}...`}
                  className="flex-1 bg-emerald-900/40 border border-emerald-700/50 rounded-xl px-5 py-3.5 outline-none focus:border-green-400 focus:bg-emerald-900/60 focus:ring-2 focus:ring-green-400/20 text-sm placeholder-emerald-500/70 text-white transition-all shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isSendingChat}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 disabled:opacity-50 text-white px-5 rounded-xl flex items-center justify-center transition-all active:scale-[0.98] shrink-0 border border-green-400/30 shadow-[0_0_15px_rgba(34,197,94,0.15)] hover:shadow-[0_0_20px_rgba(34,197,94,0.25)]"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
