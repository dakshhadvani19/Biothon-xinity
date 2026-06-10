import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, AlertCircle, RefreshCw, CheckCircle2, Scan, UploadCloud, ChevronRight, Lock } from 'lucide-react';
import remediesData from '../data/remedies.json';
import { useAuth } from '../context/AuthContext';
import { imageService } from '../services/imageService';
import { diagnosticService } from '../services/diagnosticService';

const DiagnosticCapture = () => {
  const { user, loginWithGoogle } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);
  const [resultData, setResultData] = useState(null);
  const fileInputRef = useRef(null);

  // Restore image if user just returned from Google OAuth
  useEffect(() => {
    const savedImage = sessionStorage.getItem('agrishield_pre_auth_image');
    if (savedImage && user) {
      try {
        const { base64, name, type } = JSON.parse(savedImage);
        sessionStorage.removeItem('agrishield_pre_auth_image');
        // Convert base64 back to a File
        fetch(base64)
          .then(r => r.blob())
          .then(blob => {
            const file = new File([blob], name, { type });
            setSelectedFile(file);
            setPreviewUrl(base64); // base64 works directly as <img> src
          });
      } catch (e) {
        sessionStorage.removeItem('agrishield_pre_auth_image');
      }
    }
  }, [user]); // runs whenever user changes (i.e. right after sign-in)

  // Cleanup object URL to prevent memory leaks (skip for base64 preview URLs)
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleCaptureClick = () => {
    setErrorState(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Simulate error handling
    if (file.size > 15 * 1024 * 1024) {
      setErrorState({
        what: "Image Too Large",
        why: "The captured image exceeds the 15MB limit.",
        next: "Try a compressed image."
      });
      return;
    }

    setErrorState(null);
    setResultData(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile || !user) return; // Prevent upload if not signed in
    
    setIsLoading(true);
    setErrorState(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // 1. Run ML Prediction
      const mlApiUrl = import.meta.env.DEV 
        ? "http://127.0.0.1:8000/api/v1/predict" 
        : "https://dakshhadvani19-agrishield.hf.space/api/v1/predict";

      const response = await fetch(mlApiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      setResultData(data);

      // 2. Upload to Appwrite Storage & Sync to UserImages DB
      try {
        const uploadedFile = await imageService.uploadCropImage(selectedFile);
        const fileId = uploadedFile.$id;
        
        // Save to UserImages table (URL is generated fresh from file_id — no need to store it)
        await imageService.saveUserImageRecord(user.$id, fileId);
        
        // Optional: Save to Diagnostic Logs
        await diagnosticService.saveDiagnosticLog(
          user.$id,
          "default-farm",
          data.disease,
          data.confidence,
          fileId
        );
      } catch (dbError) {
        console.error("Failed to sync with Appwrite:", dbError);
        // We don't block the UI result if DB tracking fails, we just log it.
      }

    } catch (err) {
      console.error("Inference Connection Error:", err);
      setErrorState({
        what: "Backend Failed",
        why: "Failed to reach the AI core. Ensure the ML Engine is online.",
        next: "Tap to retry"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResultData(null);
    setErrorState(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getRemedialDetails = (diseaseKey) => {
    return remediesData[diseaseKey] || {
      title: `Unmapped Key: [${diseaseKey}]`,
      severity: "Unknown",
      organic: "No verified organic treatment profile matches this machine identification key.",
      chemical: "Consult a local agricultural extension officer for broad-spectrum remediation alternatives.",
      prevention: "Isolate the infected plant zone to prevent cross-contamination vector paths."
    };
  };

  const treatment = resultData ? getRemedialDetails(resultData.disease) : null;

  return (
    <div className="max-w-xl mx-auto w-full p-4 font-sans">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        
        {/* Error State View - Premium Soft */}
        {errorState && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-red-50/90 backdrop-blur-md border border-red-100 rounded-3xl p-6 shadow-xl relative overflow-hidden"
          >
            <div className="flex items-start gap-4">
              <div className="bg-red-100 p-3 rounded-full text-red-500 shrink-0 shadow-inner border border-red-200">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-4 w-full">
                <div>
                  <h3 className="text-red-900 font-bold text-xl tracking-tight">{errorState.what}</h3>
                  <p className="text-red-700/80 font-medium text-sm mt-1">{errorState.why}</p>
                </div>
                <button
                  onClick={handleCaptureClick}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {errorState.next}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Initial Capture Mode - Premium Soft */}
        {!previewUrl && !errorState && (
          <motion.div
            key="capture"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <button
              onClick={handleCaptureClick}
              className="w-full aspect-[4/3] bg-gradient-to-br from-green-50/50 to-emerald-50/50 border-2 border-dashed border-green-200 rounded-3xl flex flex-col items-center justify-center gap-6 transition-all hover:bg-green-50/80 hover:border-green-300 hover:shadow-xl active:scale-[0.98] group relative overflow-hidden backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-green-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="bg-emerald-900/60 p-6 rounded-full shadow-lg border border-emerald-500/30 group-hover:scale-110 group-hover:bg-emerald-800/80 transition-all duration-300 z-10"
              >
                <Camera className="w-10 h-10 text-green-400" strokeWidth={2} />
              </motion.div>
              
              <div className="z-10 text-center px-4">
                <h3 className="text-2xl font-extrabold text-emerald-100 tracking-tight group-hover:text-white transition-colors">
                  Tap to Scan
                </h3>
              </div>
            </button>
          </motion.div>
        )}

        {/* Preview & Processing Mode - Premium Soft */}
        {previewUrl && !resultData && !errorState && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="relative overflow-hidden aspect-[4/3] bg-emerald-950/40 rounded-3xl shadow-2xl border border-emerald-500/20 ring-4 ring-emerald-900/50">
              <img
                src={previewUrl}
                alt="Crop preview"
                className={`w-full h-full object-cover transition-all duration-500 ${isLoading ? 'scale-105 blur-[2px] opacity-70' : 'opacity-100'}`}
              />
              
              {/* Scanning Overlay Animation */}
              {isLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-900/40 backdrop-blur-sm">
                  <motion.div 
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className="w-full h-[2px] bg-green-400 absolute shadow-[0_0_15px_rgba(74,222,128,1)]"
                  />
                  <Scan className="w-16 h-16 text-green-400 animate-pulse mb-4 drop-shadow-lg" strokeWidth={2} />
                  <span className="bg-white/90 backdrop-blur-md text-green-700 px-6 py-2 rounded-full text-sm font-bold tracking-widest border border-green-200 shadow-lg uppercase">
                    Analyzing...
                  </span>
                </div>
              )}
            </div>

            {!user ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-950/60 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-8 shadow-xl text-center relative max-w-sm mx-auto"
              >
                <motion.div 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute -top-5 left-1/2 -translate-x-1/2 bg-pink-100 text-pink-600 font-bold px-5 py-1.5 rounded-full border border-pink-200 shadow-sm"
                >
                  REQUIRED
                </motion.div>
                
                <div className="bg-pink-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner border border-pink-100">
                  <Lock className="w-10 h-10 text-pink-500" strokeWidth={2} />
                </div>
                
                <h3 className="text-2xl font-extrabold text-emerald-50 tracking-tight mb-2">Unlock AI Analysis</h3>
                <p className="text-emerald-200/70 font-medium mb-8 text-sm leading-relaxed px-2">
                  Please sign in for a better experience to save your crop scans and track health history.
                </p>

                <button
                  onClick={() => {
                    if (selectedFile) {
                      // Save image as base64 + current path before OAuth redirect
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        sessionStorage.setItem('agrishield_pre_auth_image', JSON.stringify({
                          base64: reader.result,
                          name: selectedFile.name,
                          type: selectedFile.type,
                        }));
                        sessionStorage.setItem('agrishield_pre_auth_path', window.location.pathname);
                        loginWithGoogle();
                      };
                      reader.readAsDataURL(selectedFile);
                    } else {
                      sessionStorage.setItem('agrishield_pre_auth_path', window.location.pathname);
                      loginWithGoogle();
                    }
                  }}
                  className="w-full bg-white border-2 border-gray-200 text-emerald-100 font-bold text-lg py-3.5 rounded-2xl flex items-center justify-center gap-3 transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-md google-border-hover"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleReset}
                  disabled={isLoading}
                  className="py-3.5 bg-white border border-gray-200 text-emerald-100 font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                  Retake
                </button>
                
                <button
                  onClick={handleUploadSubmit}
                  disabled={isLoading}
                  className="py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-green-500/30 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="flex items-center gap-2"
                    >
                      Analyzing...
                    </motion.div>
                  ) : (
                    <>
                      <UploadCloud className="w-5 h-5" strokeWidth={2.5} />
                      Analyze
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Results Mode - Premium Soft */}
        {resultData && treatment && !errorState && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="space-y-6"
          >
            <div className="relative aspect-video bg-gray-100 rounded-3xl shadow-xl border border-gray-200 overflow-hidden ring-4 ring-white">
               <img src={previewUrl} alt="Analyzed Crop" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
               <div className="absolute bottom-4 left-4">
                  <span className="bg-white/90 backdrop-blur-md text-green-700 text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Scanned Successfully
                  </span>
               </div>
            </div>

            <div className="bg-emerald-950/40 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-emerald-500/20 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500" />
              
              <div className="flex flex-wrap items-start justify-between border-b border-emerald-700/40 pb-5 mb-2 gap-4">
                <div>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{treatment.title}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-xs font-semibold">
                      Confidence: {Number(resultData.confidence).toFixed(1)}%
                    </span>
                    {resultData.mocked && <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-md text-xs font-semibold">Mock Data</span>}
                  </div>
                </div>
                
                <span className={`px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wide shadow-sm whitespace-nowrap ${treatment.severity === 'High' ? 'bg-red-100 text-red-600 border border-red-200' : treatment.severity === 'Moderate' ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-green-100 text-green-600 border border-green-200'}`}>
                  {treatment.severity}
                </span>
              </div>

              <div className="space-y-5 pt-2">
                <div className="bg-green-50/50 rounded-2xl p-4 border border-green-100 transition-all hover:bg-green-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <strong className="text-green-800 uppercase text-xs font-bold tracking-widest">Organic Treatment</strong>
                  </div>
                  <p className="text-emerald-100 text-sm leading-relaxed pl-4 border-l-2 border-green-200">{treatment.organic}</p>
                </div>

                <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100 transition-all hover:bg-purple-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <strong className="text-purple-800 uppercase text-xs font-bold tracking-widest">Chemical Treatment</strong>
                  </div>
                  <p className="text-emerald-100 text-sm leading-relaxed pl-4 border-l-2 border-purple-200">{treatment.chemical}</p>
                </div>

                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 transition-all hover:bg-blue-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <strong className="text-blue-800 uppercase text-xs font-bold tracking-widest">Prevention</strong>
                  </div>
                  <p className="text-emerald-100 text-sm leading-relaxed pl-4 border-l-2 border-blue-200">{treatment.prevention}</p>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="w-full bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-600/40 text-emerald-50 font-bold text-lg py-4 mt-6 transition-all rounded-2xl border border-gray-200 active:scale-[0.98] flex items-center justify-center gap-2 group"
              >
                Scan Another Leaf
                <ChevronRight className="w-5 h-5 text-emerald-300/60 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiagnosticCapture;
