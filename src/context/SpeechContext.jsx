import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { replaceNumbersWithHindi } from '../utils/hindiNumbers';

const SpeechContext = createContext(null);

export function SpeechProvider({ children }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [currentLabel, setCurrentLabel] = useState('');
  const [isHindiAvailable, setIsHindiAvailable] = useState(false);
  const [isTeluguAvailable, setIsTeluguAvailable] = useState(false);
  
  // ElevenLabs configurations
  const [elevenLabsKey, setElevenLabsKey] = useState(() => localStorage.getItem('agrishield_elevenlabs_key') || '');
  const [isElevenLabsActive, setIsElevenLabsActive] = useState(() => localStorage.getItem('agrishield_elevenlabs_active') === 'true');
  const [elevenLabsAgentId, setElevenLabsAgentId] = useState(() => {
    const stored = localStorage.getItem('agrishield_elevenlabs_agent_id') || localStorage.getItem('elevenlabs_agent_id');
    if (stored === "b421a14c-1db2-4ffb-a25e-e47a9561de61") {
      localStorage.removeItem('agrishield_elevenlabs_agent_id');
      localStorage.removeItem('elevenlabs_agent_id');
      return '';
    }
    return stored || '';
  });

  const utteranceRef = useRef(null);
  const audioRef = useRef(null);
  const location = useLocation();

  const saveElevenLabsAgentId = (id) => {
    localStorage.setItem('agrishield_elevenlabs_agent_id', id);
    localStorage.setItem('elevenlabs_agent_id', id);
    setElevenLabsAgentId(id);
  };

  // Detect native voice availability
  useEffect(() => {
    const checkVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setIsHindiAvailable(voices.some(v => v.lang.startsWith('hi')));
      setIsTeluguAvailable(voices.some(v => v.lang.startsWith('te')));
    };
    checkVoices();
    window.speechSynthesis.onvoiceschanged = checkVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Stop speech whenever the route changes
  useEffect(() => {
    stopSpeech();
  }, [location.pathname]);

  const saveElevenLabsKey = (key) => {
    localStorage.setItem('agrishield_elevenlabs_key', key);
    setElevenLabsKey(key);
  };

  const toggleElevenLabs = (active) => {
    localStorage.setItem('agrishield_elevenlabs_active', active ? 'true' : 'false');
    setIsElevenLabsActive(active);
  };

  const stopSpeech = useCallback(() => {
    // Stop native speech only if it's actually doing something to avoid Chromium cancel() stall bug
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;

    // Stop ElevenLabs audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsPlaying(false);
    setIsPaused(false);
    setIsVisible(false);
    setIsVoiceLoading(false);
    setCurrentText('');
    setCurrentLabel('');
  }, []);

  const fallbackToSpeechSynthesis = useCallback((text, lang) => {
    // We do NOT call cancel() here anymore since stopSpeech() handles it safely

    // Convert Arabic digits to Hindi words for correct pronunciation if Hindi
    const spokenText = lang === 'hi' ? replaceNumbersWithHindi(text) : text;

    const utterance = new SpeechSynthesisUtterance(spokenText);
    const langCode = lang === 'te' ? 'te-IN' : 'hi-IN';
    utterance.lang = langCode;
    utterance.rate = 0.88;
    utterance.pitch = 1.0;

    const assignVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      // FAANG optimization: Prioritize 'localService: true' voices to avoid 1.5s cloud-TTS network latency on Chrome/Android
      const matchedVoice = voices.find(v => v.lang === langCode && v.localService) || 
                           voices.find(v => v.lang === langCode) || 
                           voices.find(v => v.lang.startsWith(lang));
      if (matchedVoice) utterance.voice = matchedVoice;

      utterance.onstart = () => {
        setIsVoiceLoading(false);
        setIsPlaying(true);
        setIsPaused(false);
      };
      utterance.onend = () => {
        setIsVoiceLoading(false);
        setIsPlaying(false);
        setIsPaused(false);
        setIsVisible(false);
      };
      utterance.onerror = () => {
        setIsVoiceLoading(false);
        setIsPlaying(false);
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      
      // Chromium Bug Bypass: If cancel() was called recently, speak() will stall for 1.5s
      // Deferring the speak call by a microscopic 50ms completely bypasses this artificial block!
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 50);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      assignVoiceAndSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        assignVoiceAndSpeak();
      };
    }
  }, []);

  const speak = useCallback(async (text, lang = 'hi', label = 'AI Response') => {
    if (!text) return;
    stopSpeech();

    // Comprehensive text sanitizer for TTS:
    // 1. Replace underscores with spaces (prevents letter-by-letter reading)
    // 2. Remove JSON/Code artifacts
    // 3. Remove Markdown artifacts
    const cleanedText = text
      .replace(/_/g, ' ') 
      .replace(/[{}\[\]":]/g, '')
      .replace(/\*\*/g, '')
      .replace(/[*#`]/g, '')
      .trim();

    setCurrentText(text);
    setCurrentLabel(label);
    setIsVisible(true);
    setIsVoiceLoading(true);
    setIsPlaying(false);
    setIsPaused(false);

    const activeKey = localStorage.getItem('agrishield_elevenlabs_key') || '';
    const use11Labs = localStorage.getItem('agrishield_elevenlabs_active') === 'true';

    if (use11Labs) {
      try {
        const mlUrl = import.meta.env.VITE_ML_ENGINE_URL || 'http://localhost:8000';
        const response = await fetch(`${mlUrl}/api/v1/tts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: cleanedText,
            lang: lang,
            api_key: activeKey || null
          })
        });

        if (!response.ok) {
          throw new Error('ElevenLabs server call failed');
        }

        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsVoiceLoading(false);
          setIsPlaying(true);
          setIsPaused(false);
        };
        audio.onended = () => {
          setIsVoiceLoading(false);
          setIsPlaying(false);
          setIsPaused(false);
          setIsVisible(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          console.warn("ElevenLabs audio playback failed, falling back to local TTS");
          setIsVoiceLoading(false);
          fallbackToSpeechSynthesis(cleanedText, lang);
        };

        await audio.play();
      } catch (err) {
        console.warn("ElevenLabs TTS failed, playing local fallback", err);
        setIsVoiceLoading(false);
        fallbackToSpeechSynthesis(cleanedText, lang);
      }
    } else {
      fallbackToSpeechSynthesis(cleanedText, lang);
    }
  }, [stopSpeech, fallbackToSpeechSynthesis]);

  const pauseSpeech = useCallback(() => {
    const use11Labs = localStorage.getItem('agrishield_elevenlabs_active') === 'true';
    if (use11Labs && audioRef.current) {
      audioRef.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    } else if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  }, []);

  const resumeSpeech = useCallback(() => {
    const use11Labs = localStorage.getItem('agrishield_elevenlabs_active') === 'true';
    if (use11Labs && audioRef.current) {
      audioRef.current.play().catch(() => {});
      setIsPaused(false);
      setIsPlaying(true);
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    }
  }, []);

  return (
    <SpeechContext.Provider value={{
      speak,
      stopSpeech,
      pauseSpeech,
      resumeSpeech,
      isVisible,
      isPlaying,
      isPaused,
      isVoiceLoading,
      currentText,
      currentLabel,
      isHindiAvailable,
      isTeluguAvailable,
      elevenLabsKey,
      isElevenLabsActive,
      elevenLabsAgentId,
      saveElevenLabsKey,
      toggleElevenLabs,
      saveElevenLabsAgentId
    }}>
      {children}
    </SpeechContext.Provider>
  );
}

export function useSpeech() {
  const ctx = useContext(SpeechContext);
  if (!ctx) throw new Error('useSpeech must be used within SpeechProvider');
  return ctx;
}
