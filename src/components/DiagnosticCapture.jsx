import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, AlertCircle, RefreshCw, CheckCircle2, Scan, UploadCloud, Leaf, ChevronRight } from 'lucide-react';

const DiagnosticCapture = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);
  const [resultData, setResultData] = useState(null);
  const fileInputRef = useRef(null);

  // Cleanup object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleCaptureClick = () => {
    setErrorState(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Simulate error handling (e.g., file too large)
    if (file.size > 15 * 1024 * 1024) {
      setErrorState({
        what: "Image Processing Failed",
        why: "The captured image is too large (exceeds 15MB) for low-bandwidth processing.",
        next: "Action: Tap here to retry the upload or capture a new image."
      });
      return;
    }

    setErrorState(null);
    setResultData(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSimulateUpload = () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setErrorState(null);

    // Mock processing payload latency (2000ms)
    setTimeout(() => {
      setIsLoading(false);
      setResultData({
        status: "success",
        diagnosis: "Healthy Canopy",
        confidence: "98.7%",
        recommendation: "Maintain current moisture levels. No pathogen detected."
      });
    }, 2000);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResultData(null);
    setErrorState(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-xl mx-auto w-full">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {/* Error State View */}
        {errorState && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="bg-red-100 p-3 rounded-full text-red-600 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-3 w-full">
                <div>
                  <h3 className="text-red-900 font-bold text-lg">{errorState.what}</h3>
                  <p className="text-red-700 text-sm mt-1">{errorState.why}</p>
                </div>
                <button
                  onClick={handleCaptureClick}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-xl transition-colors active:scale-95 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {errorState.next}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Initial Capture Mode */}
        {!previewUrl && !errorState && (
          <motion.div
            key="capture"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={handleCaptureClick}
              className="w-full aspect-[4/3] bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-dashed border-green-300 rounded-3xl flex flex-col items-center justify-center gap-6 hover:border-green-400 hover:shadow-lg transition-all active:scale-[0.98] group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-green-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
              
              <div className="bg-white p-6 rounded-full shadow-sm ring-4 ring-green-50 group-hover:ring-green-100 transition-all z-10">
                <Camera className="w-10 h-10 text-green-600" />
              </div>
              <div className="z-10 text-center px-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Tap to Scan Crop</h3>
                <p className="text-gray-500 text-sm max-w-[250px]">
                  Use your device camera to capture high-resolution imagery of affected leaves.
                </p>
              </div>
            </button>
          </motion.div>
        )}

        {/* Preview & Processing Mode */}
        {previewUrl && !resultData && !errorState && (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-gray-900 shadow-lg border border-gray-100">
              <img
                src={previewUrl}
                alt="Crop preview"
                className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
              />
              
              {/* Scanning Overlay Animation */}
              {isLoading && (
                <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
                  <motion.div 
                    animate={{ y: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="w-full h-1 bg-green-400 shadow-[0_0_15px_rgba(74,222,128,1)] absolute top-0"
                  />
                  <Scan className="w-12 h-12 text-white/80 animate-pulse mb-4" />
                  <span className="bg-gray-900/80 text-white px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm border border-gray-700/50">
                    Analyzing Pattern...
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleReset}
                disabled={isLoading}
                className="py-4 px-4 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                Retake
              </button>
              
              <button
                onClick={handleSimulateUpload}
                disabled={isLoading}
                className="py-4 px-4 bg-green-600 text-white font-bold rounded-xl active:scale-95 transition-all disabled:opacity-90 disabled:pointer-events-none relative overflow-hidden flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="flex items-center gap-2"
                  >
                    Processing...
                  </motion.div>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5" />
                    Analyze Image
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Results Mode */}
        {resultData && !errorState && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="relative rounded-3xl overflow-hidden aspect-video bg-gray-900 border border-gray-100">
               <img src={previewUrl} alt="Analyzed Crop" className="w-full h-full object-cover opacity-80" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
               <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className="bg-green-500/90 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 className="w-3 h-3" /> Scanned Successfully
                  </span>
               </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    {resultData.diagnosis}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">Diagnostic Confidence: <span className="font-semibold text-green-600">{resultData.confidence}</span></p>
                </div>
                <div className="bg-green-100 p-2.5 rounded-full text-green-600">
                  <Leaf className="w-6 h-6" />
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recommendation</h4>
                <p className="text-gray-800 text-sm leading-relaxed">{resultData.recommendation}</p>
              </div>

              <button
                onClick={handleReset}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3.5 px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 group"
              >
                Scan Another Area
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiagnosticCapture;
