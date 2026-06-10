import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Apple, Search, Flame, Droplet, Sparkles, 
  Heart, BookOpen, UploadCloud, RefreshCw, AlertTriangle, Trash2
} from 'lucide-react';
import { aiService } from '../services/aiService';

export default function NutrientAnalysis() {
  const [plantName, setPlantName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  // Helper to safely extract value and percentage for macronutrients
  const getMacroDetails = (key) => {
    const macro = analysisResult?.macronutrients?.[key];
    if (!macro) return { value: '0g', percentage: 0 };
    if (typeof macro === 'object') {
      return {
        value: macro.value || '0g',
        percentage: macro.percentage || 0
      };
    }
    return { value: String(macro), percentage: 0 };
  };

  // Quick suggestion chips
  const suggestions = ["Moringa", "Spinach", "Avocado", "Garlic", "Pomegranate"];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleAnalyze = async (e, customName = null) => {
    if (e) e.preventDefault();
    const queryName = customName || plantName;
    
    if (!queryName.trim() && !selectedFile) {
      setError("Please type a plant name or select an image.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      let payload = { name: queryName };
      
      if (selectedFile && !customName) {
        const base64Image = await readFileAsBase64(selectedFile);
        payload.image = base64Image;
        payload.filename = selectedFile.name;
      }
      
      const result = await aiService.analyzeNutrition(payload);
      setAnalysisResult(result);
      
      if (result && result.name && !queryName.trim()) {
        setPlantName(result.name);
      }
    } catch (err) {
      console.error("Nutrition analysis error:", err);
      setError("Failed to reach the AI engine. Check if backend is active.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSuggestionClick = (name) => {
    setPlantName(name);
    handleAnalyze(null, name);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 mt-12 md:mt-20 pb-16 px-4 sm:px-0">
      {/* Header section */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h1 className="text-4xl font-extrabold text-white flex items-center gap-4 tracking-tight drop-shadow-sm">
          <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-3 rounded-2xl shadow-[0_0_20px_rgba(52,211,153,0.3)] text-white">
            <Apple className="w-7 h-7" />
          </div>
          Nutrient Analysis
        </h1>
        <p className="text-emerald-100/70 mt-3 text-lg font-medium max-w-2xl">
          Explore detailed carbohydrates, vitamins, minerals, and health benefits of any plant, vegetable, or fruit.
        </p>
      </header>

      {/* Input panel */}
      <section className="bg-emerald-950/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-500/20 relative overflow-hidden p-6 md:p-8">
        <form onSubmit={(e) => handleAnalyze(e)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-5">
            <div>
              <label htmlFor="plant-search" className="block text-sm font-extrabold text-emerald-100 mb-2">
                Enter Plant, Vegetable, or Fruit Name
              </label>
              <div className="relative">
                <input
                  id="plant-search"
                  type="text"
                  value={plantName}
                  onChange={(e) => setPlantName(e.target.value)}
                  placeholder="e.g. Moringa, Spinach, Avocado, Banana..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 pl-12 focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all text-emerald-50 font-medium shadow-inner placeholder-gray-400"
                />
                <Search className="w-5 h-5 text-emerald-300/60 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Quick Suggestions */}
            <div>
              <span className="block text-xs font-bold text-emerald-300/60 uppercase tracking-wider mb-2.5">
                Popular suggestions
              </span>
              <div className="flex flex-wrap gap-2">
                {suggestions.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleSuggestionClick(item)}
                    className="bg-emerald-900/30 hover:bg-emerald-800/50 border border-emerald-700/50 rounded-xl px-3.5 py-2 text-xs font-bold text-emerald-100/80 hover:text-emerald-300 hover:border-green-300 transition-all active:scale-95"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Optional Image Upload */}
          <div className="flex flex-col justify-between space-y-4">
            <div>
              <span className="block text-sm font-extrabold text-emerald-100 mb-2 flex justify-between">
                <span>Upload Plant Photo</span>
                <span className="text-xs text-emerald-300/60 font-semibold bg-emerald-900/50 border border-emerald-700/50 px-2.5 py-1 rounded-full">Optional</span>
              </span>
              <div 
                onClick={triggerFileSelect}
                className="border-2 border-dashed border-emerald-700/50 hover:border-green-400/70 hover:bg-emerald-800/30 bg-emerald-900/20 rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px]"
              >
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                {imagePreview ? (
                  <div className="relative group w-full flex justify-center">
                    <img src={imagePreview} alt="Upload preview" className="max-h-[100px] rounded-lg object-cover w-full" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-6 h-6 text-emerald-300/60 mb-2" />
                    <span className="text-xs font-bold text-emerald-100/80">Select Image</span>
                  </>
                )}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 35px rgba(52,211,153,0.5)" }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              type="submit"
              disabled={isAnalyzing}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-extrabold text-lg py-4.5 px-6 rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50 mt-4 flex items-center justify-center gap-3 border border-green-400/40 relative overflow-hidden group"
            >
              <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform skew-x-[-20deg] group-hover:left-[200%] transition-all duration-1000 ease-in-out pointer-events-none" />
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin relative z-10" />
                  <span className="relative z-10">Analyzing Bio-Components...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 relative z-10 group-hover:scale-125 transition-transform duration-300" />
                  <span className="relative z-10 drop-shadow-md">Analyze Nutritional Profile</span>
                </>
              )}
            </motion.button>
          </div>
        </form>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}
      </section>

      {/* Analysis Results */}
      <AnimatePresence mode="wait">
        {/* Loading State */}
        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-emerald-950/40 backdrop-blur-xl rounded-3xl p-12 border border-emerald-500/20 shadow-2xl flex flex-col items-center justify-center space-y-6 relative overflow-hidden"
          >
            <motion.div 
              animate={{ y: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
              className="w-full h-1.5 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,1)] absolute top-0 left-0"
            />
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 relative">
              <Apple className="w-8 h-8 animate-pulse" />
              <div className="absolute inset-0 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white">Calculating Bio-Nutrients</h3>
              <p className="text-emerald-200/70 max-w-sm text-sm">
                Parsing plant identity, retrieving vitamin indices, carbohydrates ratio, and correlating health studies...
              </p>
            </div>
          </motion.div>
        )}

        {/* Results Screen */}
        {analysisResult && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Column: Summary & Macronutrients */}
              <div className="bg-emerald-950/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-emerald-500/20 shadow-2xl relative overflow-hidden space-y-6 md:col-span-1">
                <div className="text-center border-b border-gray-100 pb-5">
                  <h2 className="text-2xl font-black text-white capitalize">{analysisResult.name}</h2>
                  {analysisResult.detected_from_image && (
                    <div className="inline-flex items-center gap-1 mt-1 bg-green-50 text-emerald-300 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border border-green-200 uppercase tracking-wider">
                      📸 Detected from Image
                    </div>
                  )}
                  <div className="flex justify-center gap-2 mt-2">
                    <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-200">
                      <Flame className="w-3.5 h-3.5" />
                      {analysisResult.calories}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-emerald-50 mb-4 uppercase tracking-wider">Macronutrients Split</h3>
                  <div className="space-y-4">
                    {/* Carbs */}
                    {(() => {
                      const details = getMacroDetails('carbs');
                      return (
                        <div>
                          <div className="flex justify-between text-xs font-bold mb-1.5 text-emerald-200/70">
                            <span>Carbohydrates</span>
                            <span className="text-white font-extrabold">
                              {details.value}{details.percentage > 0 ? ` (${details.percentage}% DV)` : ''}
                            </span>
                          </div>
                          <div className="w-full bg-emerald-900/40 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-yellow-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" 
                              style={{ width: `${Math.min(100, Math.max(0, details.percentage))}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Protein */}
                    {(() => {
                      const details = getMacroDetails('protein');
                      return (
                        <div>
                          <div className="flex justify-between text-xs font-bold mb-1.5 text-emerald-200/70">
                            <span>Protein</span>
                            <span className="text-white font-extrabold">
                              {details.value}{details.percentage > 0 ? ` (${details.percentage}% DV)` : ''}
                            </span>
                          </div>
                          <div className="w-full bg-emerald-900/40 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-green-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" 
                              style={{ width: `${Math.min(100, Math.max(0, details.percentage))}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Fiber */}
                    {(() => {
                      const details = getMacroDetails('fiber');
                      return (
                        <div>
                          <div className="flex justify-between text-xs font-bold mb-1.5 text-emerald-200/70">
                            <span>Dietary Fiber</span>
                            <span className="text-white font-extrabold">
                              {details.value}{details.percentage > 0 ? ` (${details.percentage}% DV)` : ''}
                            </span>
                          </div>
                          <div className="w-full bg-emerald-900/40 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-600 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(5,150,105,0.5)]" 
                              style={{ width: `${Math.min(100, Math.max(0, details.percentage))}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })()}

                    {/* Fat */}
                    {(() => {
                      const details = getMacroDetails('fat');
                      return (
                        <div>
                          <div className="flex justify-between text-xs font-bold mb-1.5 text-emerald-200/70">
                            <span>Fat</span>
                            <span className="text-white font-extrabold">
                              {details.value}{details.percentage > 0 ? ` (${details.percentage}% DV)` : ''}
                            </span>
                          </div>
                          <div className="w-full bg-emerald-900/40 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-red-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(248,113,113,0.5)]" 
                              style={{ width: `${Math.min(100, Math.max(0, details.percentage))}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Right Column: Vitamins & Minerals */}
              <div className="bg-emerald-950/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-emerald-500/20 shadow-2xl relative overflow-hidden md:col-span-2 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                    <Droplet className="w-5 h-5 text-blue-500" />
                    Micronutrient Composition
                  </h3>
                  <p className="text-xs text-emerald-300/60">Important vitamins and minerals per serving of {analysisResult.name}.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Vitamins */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-emerald-300/60 uppercase tracking-wider">Vitamins</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.vitamins?.map((vit, i) => (
                        <span key={i} className="bg-green-50 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-green-200/50">
                          {vit}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Minerals */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-emerald-300/60 uppercase tracking-wider">Minerals</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.minerals?.map((min, i) => (
                        <span key={i} className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-200/50">
                          {min}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Health & Medicinal Benefits Grid */}
            <div className="bg-emerald-950/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-emerald-500/20 shadow-2xl relative overflow-hidden space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  Health & Medicinal Benefits
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysisResult.health_benefits?.map((benefit, i) => (
                  <div key={i} className="bg-emerald-900/30 border border-emerald-700/30 backdrop-blur-sm rounded-2xl p-5 space-y-2">
                    <h4 className="font-extrabold text-sm text-emerald-50 flex items-center gap-1.5">
                      <span className="text-green-500">✓</span>
                      {benefit.title}
                    </h4>
                    <p className="text-xs text-emerald-200/70 leading-relaxed">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Usage/Preparation Tips */}
            <div className="bg-emerald-950/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-emerald-500/20 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-300" />
                Consumption & Preparation Guidelines
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysisResult.usage_tips?.map((tip, i) => (
                  <div key={i} className="bg-emerald-900/30 border border-emerald-700/30 backdrop-blur-sm p-4 rounded-xl flex gap-2.5 items-start">
                    <span className="text-green-600 font-extrabold text-sm shrink-0">💡</span>
                    <p className="text-xs text-emerald-100 leading-relaxed font-medium">{tip}</p>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
