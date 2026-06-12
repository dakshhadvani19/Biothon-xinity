import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Square, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { replaceNumbersWithHindi } from '../utils/hindiNumbers';

/**
 * HindiVoicePlayer
 * ─────────────────
 * Props:
 *   hindiText  {string}   – Pure Hindi text to speak (Devanagari)
 *   label      {string}   – Display label (optional)
 *   compact    {boolean}  – If true, renders a small inline button (for chat bubbles)
 */
export default function HindiVoicePlayer({ hindiText, label = 'हिंदी रिपोर्ट', compact = false }) {
  // State machine: 'idle' | 'loading' | 'playing' | 'error'
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const utteranceRef = useRef(null);
  const timeoutRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  const stopPlayback = useCallback(() => {
    clearTimeout(timeoutRef.current);
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setStatus('idle');
  }, []);

  const startSpeech = useCallback((voices) => {
    if (!hindiText) {
      setErrorMsg('हिंदी टेक्स्ट उपलब्ध नहीं है। कृपया पहले विश्लेषण करें।');
      setStatus('error');
      return;
    }

    // Voice priority: hi-IN → hi → hi*
    const hindiVoice =
      voices.find(v => v.lang === 'hi-IN') ||
      voices.find(v => v.lang === 'hi') ||
      voices.find(v => v.lang.startsWith('hi'));

    if (!hindiVoice) {
      setErrorMsg('इस डिवाइस पर हिंदी आवाज़ उपलब्ध नहीं है। कृपया Google Chrome में खोलें।');
      setStatus('error');
      return;
    }

    clearTimeout(timeoutRef.current);

    // Convert all Arabic digits to Hindi words before speaking
    const spokenText = replaceNumbersWithHindi(hindiText);

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.voice = hindiVoice;
    utterance.lang = 'hi-IN';
    utterance.rate = 0.88;
    utterance.pitch = 1.0;

    utterance.onstart = () => setStatus('playing');
    utterance.onend = () => {
      utteranceRef.current = null;
      setStatus('idle');
    };
    utterance.onerror = (e) => {
      console.warn('[HindiVoicePlayer] TTS error:', e.error);
      utteranceRef.current = null;
      if (e.error !== 'interrupted') {
        setErrorMsg('आवाज़ चलाने में समस्या हुई। दोबारा कोशिश करें।');
        setStatus('error');
      } else {
        setStatus('idle');
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [hindiText]);

  const handlePlay = useCallback(() => {
    if (status === 'playing') {
      stopPlayback();
      return;
    }

    setStatus('loading');
    setErrorMsg('');
    window.speechSynthesis.cancel();

    const tryStart = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        startSpeech(voices);
      } else {
        // Set 8-second timeout for voice loading
        timeoutRef.current = setTimeout(() => {
          const retryVoices = window.speechSynthesis.getVoices();
          if (retryVoices.length > 0) {
            startSpeech(retryVoices);
          } else {
            setErrorMsg('हिंदी आवाज़ लोड नहीं हो सकी। कृपया Chrome में खोलें या दोबारा कोशिश करें।');
            setStatus('error');
          }
        }, 8000);

        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.onvoiceschanged = null;
          clearTimeout(timeoutRef.current);
          const voices = window.speechSynthesis.getVoices();
          startSpeech(voices);
        };
      }
    };

    tryStart();
  }, [status, stopPlayback, startSpeech]);

  const handleRetry = useCallback(() => {
    setStatus('idle');
    setErrorMsg('');
    setTimeout(handlePlay, 100);
  }, [handlePlay]);

  // ── COMPACT MODE (for chat bubbles) ──────────────────────────────────────
  if (compact) {
    return (
      <div className="mt-3">
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.button
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handlePlay}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-emerald-100 hover:bg-emerald-800/80 px-3 py-1.5 rounded-lg transition-all active:scale-95 border border-emerald-600/40"
            >
              <Volume2 className="w-3.5 h-3.5" />
              हिंदी में सुनें
            </motion.button>
          )}

          {status === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs text-amber-300/80 px-3 py-1.5 rounded-lg bg-amber-900/20 border border-amber-700/30"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              हिंदी लोड हो रही है...
            </motion.div>
          )}

          {status === 'playing' && (
            <motion.button
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={stopPlayback}
              className="flex items-center gap-2 text-xs font-bold text-green-300 px-3 py-1.5 rounded-lg bg-green-900/30 border border-green-600/40 active:scale-95"
            >
              <WaveformBars compact />
              <Square className="w-3 h-3" />
              रोकें
            </motion.button>
          )}

          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs"
            >
              <span className="text-red-300/80 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                आवाज़ उपलब्ध नहीं
              </span>
              <button
                onClick={handleRetry}
                className="text-emerald-300 hover:text-white px-2 py-1 rounded-md bg-emerald-800/40 border border-emerald-700/40 transition-all active:scale-95"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── FULL MODE (for report header) ─────────────────────────────────────────
  return (
    <AnimatePresence mode="wait">
      {/* IDLE */}
      {status === 'idle' && (
        <motion.button
          key="idle"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          onClick={handlePlay}
          whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(52,211,153,0.2)' }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2.5 px-5 py-2.5 bg-emerald-900/50 hover:bg-emerald-800/70 text-emerald-100 font-bold text-sm rounded-xl border border-emerald-600/40 transition-all shadow-lg backdrop-blur-md"
        >
          <Volume2 className="w-4 h-4 text-emerald-400" />
          पूरी रिपोर्ट हिंदी में सुनें
        </motion.button>
      )}

      {/* LOADING */}
      {status === 'loading' && (
        <motion.div
          key="loading"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="flex items-center gap-3 px-5 py-2.5 bg-amber-900/30 border border-amber-600/30 rounded-xl backdrop-blur-md shadow-lg"
        >
          <div className="relative flex items-center justify-center w-5 h-5">
            <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-200">हिंदी आवाज़ तैयार हो रही है...</p>
            <p className="text-xs text-amber-300/60 mt-0.5">कृपया 5-10 सेकंड प्रतीक्षा करें</p>
          </div>
          {/* Loading shimmer dots */}
          <div className="flex gap-1 ml-2">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-amber-400"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* PLAYING */}
      {status === 'playing' && (
        <motion.button
          key="playing"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          onClick={stopPlayback}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-3 px-5 py-2.5 bg-green-900/40 border border-green-500/40 rounded-xl backdrop-blur-md shadow-lg transition-all"
        >
          <WaveformBars />
          <span className="text-sm font-bold text-green-200">हिंदी रिपोर्ट चल रही है</span>
          <div className="ml-2 flex items-center gap-1.5 bg-red-900/40 border border-red-500/30 px-2.5 py-1 rounded-lg">
            <Square className="w-3.5 h-3.5 text-red-300" />
            <span className="text-xs font-bold text-red-300">रोकें</span>
          </div>
        </motion.button>
      )}

      {/* ERROR */}
      {status === 'error' && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: 4, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4 }}
          className="flex items-start gap-3 px-5 py-3 bg-red-950/40 border border-red-500/30 rounded-xl backdrop-blur-md shadow-lg max-w-sm"
        >
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-200">आवाज़ उपलब्ध नहीं</p>
            <p className="text-xs text-red-300/70 mt-0.5 leading-relaxed">{errorMsg}</p>
          </div>
          <button
            onClick={handleRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/50 hover:bg-emerald-800/70 text-emerald-200 text-xs font-bold rounded-lg border border-emerald-600/40 transition-all active:scale-95 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            दोबारा
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Animated waveform bars ───────────────────────────────────────────────────
function WaveformBars({ compact = false }) {
  const heights = compact
    ? [8, 14, 10, 16, 10, 14, 8]
    : [10, 18, 12, 22, 16, 22, 12, 18, 10];

  return (
    <div className={`flex items-center gap-0.5 ${compact ? 'h-4' : 'h-6'}`}>
      {heights.map((h, i) => (
        <motion.div
          key={i}
          className={`${compact ? 'w-0.5' : 'w-1'} rounded-full bg-green-400`}
          style={{ height: compact ? h / 2 : h }}
          animate={{ scaleY: [1, 1.8, 0.6, 1.4, 1] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: i * 0.08,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
