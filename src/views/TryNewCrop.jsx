import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sprout, MapPin, Thermometer, Cloud, CheckCircle2, 
  AlertTriangle, UploadCloud, Send, MessageSquare, 
  Calendar, RefreshCw, Sparkles, BookOpen 
} from 'lucide-react';
import { getFarmerCoordinates, getSmartWeatherUpdates } from '../services/weatherService';
import { aiService } from '../services/aiService';

export default function TryNewCrop() {
  // Form inputs
  const [cropName, setCropName] = useState('');
  const [soilType, setSoilType] = useState('Black Soil');
  const [customSoil, setCustomSoil] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!cropName.trim()) {
      setError("Please specify the name of the plant/crop.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setChatMessages([]);

    const finalSoil = soilType === 'Other (Specify)' ? customSoil : soilType;
    const finalCoords = coords || { lat: 22.3039, lon: 70.8022 }; // Rajkot fallback

    try {
      const payload = {
        crop_name: cropName,
        lat: finalCoords.lat,
        lon: finalCoords.lon,
        soil_type: finalSoil,
        current_temp: weatherData?.currentTemp || 0,
        current_condition: weatherData?.condition || 'Unknown'
      };

      const result = await aiService.checkCropSuitability(payload);
      setAnalysisResult(result);
      
      // Initialize inline chat with a greeting
      setChatMessages([
        {
          role: 'assistant',
          content: `Hello! I have completed the suitability report for growing **${cropName}** on your **${finalSoil}** land in this region. The analysis suggests it is **${result.suitable}** with a compatibility rating of **${result.suitability_score}%**. \n\nHow can I assist you with planting preparations or crop management suggestions?`
        }
      ]);
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Analysis connection failed. Make sure the backend server is running.");
    } finally {
      setIsAnalyzing(false);
    }
  };

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
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: response.content }]);
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
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header section */}
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-2xl shadow-md text-white">
              <Sprout className="w-6 h-6" />
            </div>
            Try New Crop Advisor
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Verify if a new plant is suitable for your specific soil type and seasonal weather.
          </p>
        </div>

        {/* Geolocation status badge */}
        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2.5 shadow-sm flex items-center gap-3 self-start md:self-auto">
          <div className="bg-green-50 p-2 rounded-full text-green-600 animate-pulse">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Present Location</div>
            <div className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              {isSyncingLocation ? (
                <span className="text-gray-400 font-normal">Detecting GPS...</span>
              ) : coords ? (
                <span>{coords.lat.toFixed(4)}, {coords.lon.toFixed(4)} {weatherData ? `(${weatherData.currentTemp}°C)` : ''}</span>
              ) : (
                <span className="text-amber-600 font-medium">Rajkot, India (Default)</span>
              )}
              <button 
                onClick={syncLocationAndWeather} 
                disabled={isSyncingLocation}
                className="text-gray-400 hover:text-green-600 transition-colors ml-1"
                title="Sync Location"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLocation ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main input form panel */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
        <form onSubmit={handleAnalyze} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Inputs */}
            <div className="space-y-5">
              <div>
                <label htmlFor="crop-name" className="block text-sm font-extrabold text-gray-700 mb-2">
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
                    className="w-full bg-gray-50 border border-gray-200/80 rounded-2xl px-5 py-4 pl-12 focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all text-gray-800 font-medium placeholder-gray-400 shadow-inner"
                  />
                  <Sparkles className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-extrabold text-gray-700 mb-2">
                  What is the soil type of your plot?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {soilOptions.map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSoilType(option)}
                      className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all duration-200 text-center ${
                        soilType === option
                          ? 'border-green-500 bg-green-50/50 text-green-700 shadow-sm'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
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
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all text-sm font-medium"
                    />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Right Side: Optional Image Selector */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="block text-sm font-extrabold text-gray-700 mb-2 flex items-center justify-between">
                  <span>Plant / Soil Image Selection</span>
                  <span className="text-xs text-gray-400 font-semibold bg-gray-100 px-2 py-0.5 rounded-full">Optional</span>
                </span>
                
                <div 
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={triggerFileSelect}
                  className="border-2 border-dashed border-gray-200 hover:border-green-400 hover:bg-green-50/5 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[190px]"
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                  {imagePreview ? (
                    <div className="relative group rounded-xl overflow-hidden max-h-[170px] w-full">
                      <img src={imagePreview} alt="Crop preview" className="w-full h-full object-cover rounded-xl" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-semibold text-xs">
                        Change Image
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gray-50 p-4 rounded-full text-gray-400 group-hover:text-green-500 group-hover:bg-green-50 transition-all mb-3">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-bold text-gray-700 mb-1">Drag & Drop Image</h4>
                      <p className="text-xs text-gray-400 max-w-[200px] mx-auto">
                        Upload a photo of the soil or plant type to help target the description.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-2xl shadow-md transition-all active:scale-98 disabled:opacity-50 mt-6 flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Crunching Climate Telemetry...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Analyze Suitability
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
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
            className="bg-white rounded-3xl p-12 border border-gray-100 shadow-sm flex flex-col items-center justify-center space-y-6 relative overflow-hidden"
          >
            <motion.div 
              animate={{ y: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-full h-1.5 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,1)] absolute top-0 left-0"
            />
            <div className="relative">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                <Sprout className="w-10 h-10 animate-bounce" />
              </div>
              <div className="absolute inset-0 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Assessing Crop Viability</h3>
              <p className="text-gray-500 max-w-sm">
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
            className="space-y-8"
          >
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Suitability Radial Gauge */}
              <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-8 text-center">
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle 
                      cx="80" 
                      cy="80" 
                      r="65" 
                      className="text-gray-100" 
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
                          ? 'text-green-500' 
                          : analysisResult.suitability_score >= 50 
                            ? 'text-amber-500' 
                            : 'text-red-500'
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
                    <span className="text-4xl font-extrabold text-gray-900">{analysisResult.suitability_score}%</span>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Compatibility</span>
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                    analysisResult.suitable === 'Highly Suitable'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : analysisResult.suitable === 'Moderately Suitable'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {analysisResult.suitable}
                  </span>
                  <p className="text-xs text-gray-400 mt-2 font-medium">For typed crop: **{cropName}**</p>
                </div>
              </div>

              {/* Compatibility Details (Weather, Soil, Climate) */}
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-green-600" />
                    Scientific Suitability Breakdown
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 flex gap-3.5 items-start">
                    <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600 shrink-0">
                      <Thermometer className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">Atmospheric Feasibility</h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{analysisResult.weather_analysis}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 flex gap-3.5 items-start">
                    <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600 shrink-0">
                      <Sprout className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">Soil Condition Fit</h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{analysisResult.soil_analysis}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 sm:col-span-2 flex gap-3.5 items-start">
                    <div className="bg-green-50 p-2.5 rounded-xl text-green-600 shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">Yearly & Seasonal Climate Trend</h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{analysisResult.yearly_climate_analysis}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations & Warnings Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Cultivation Recommendations
                </h3>
                <ul className="space-y-3">
                  {analysisResult.recommendations?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 font-bold shrink-0 mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Necessary Precautions
                </h3>
                <ul className="space-y-3">
                  {analysisResult.precautions?.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-amber-500 font-bold shrink-0 mt-0.5">⚠️</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* INTEGRATED ADVISORY CHAT ON THE SAME PAGE */}
            <div className="bg-gradient-to-br from-green-950 to-emerald-900 text-white rounded-3xl shadow-xl overflow-hidden border border-emerald-800">
              <div className="p-6 border-b border-emerald-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-800 p-2.5 rounded-xl">
                    <MessageSquare className="w-5 h-5 text-green-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Agronomic Expert Chat Advisor</h3>
                    <p className="text-xs text-emerald-300">Discuss planting instructions and ask follow-up agronomic questions.</p>
                  </div>
                </div>
                <div className="bg-emerald-800/60 px-3 py-1 rounded-full text-xs font-bold text-emerald-200 border border-emerald-700/50">
                  Focus: {cropName}
                </div>
              </div>

              {/* Chat Message Thread */}
              <div className="h-80 overflow-y-auto p-6 space-y-4 bg-emerald-950/60">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white rounded-br-none shadow-sm' 
                          : 'bg-emerald-850/80 border border-emerald-800 text-emerald-50 rounded-bl-none shadow-inner whitespace-pre-wrap'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isSendingChat && (
                  <div className="flex justify-start">
                    <div className="bg-emerald-800/60 border border-emerald-700/50 rounded-2xl rounded-bl-none px-4 py-3 text-sm text-emerald-300 flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-emerald-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-emerald-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-emerald-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      AI is typing...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Field */}
              <form onSubmit={handleSendChat} className="p-4 bg-emerald-950 border-t border-emerald-800/80 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Ask a question about growing ${cropName}...`}
                  className="flex-1 bg-emerald-900/40 border border-emerald-800 rounded-xl px-4 py-3 outline-none focus:border-green-500 focus:bg-emerald-900/60 text-sm placeholder-emerald-500 text-white transition-all"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isSendingChat}
                  className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-4 rounded-xl flex items-center justify-center transition-colors active:scale-95 shrink-0"
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
