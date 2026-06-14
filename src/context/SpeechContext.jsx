import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { replaceNumbersWithHindi } from '../utils/hindiNumbers';

const SpeechContext = createContext(null);

export function SpeechProvider({ children }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
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
    // Stop native speech
    window.speechSynthesis.cancel();
    utteranceRef.current = null;

    // Stop ElevenLabs audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsPlaying(false);
    setIsPaused(false);
    setIsVisible(false);
    setCurrentText('');
    setCurrentLabel('');
  }, []);

  const fallbackToSpeechSynthesis = useCallback((text, lang) => {
    window.speechSynthesis.cancel();

    // Convert Arabic digits to Hindi words for correct pronunciation if Hindi
    const spokenText = lang === 'hi' ? replaceNumbersWithHindi(text) : text;

    const utterance = new SpeechSynthesisUtterance(spokenText);
    const langCode = lang === 'te' ? 'te-IN' : 'hi-IN';
    utterance.lang = langCode;
    utterance.rate = 0.88;
    utterance.pitch = 1.0;

    const assignVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => v.lang === langCode) || 
                          voices.find(v => v.lang.startsWith(lang));
      if (matchedVoice) utterance.voice = matchedVoice;

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsPaused(false);
      };
      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setIsVisible(false);
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
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
    setIsPlaying(true);
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
          setIsPlaying(true);
          setIsPaused(false);
        };
        audio.onended = () => {
          setIsPlaying(false);
          setIsPaused(false);
          setIsVisible(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          console.warn("ElevenLabs audio playback failed, falling back to local TTS");
          fallbackToSpeechSynthesis(cleanedText, lang);
        };

        await audio.play();
      } catch (err) {
        console.warn("ElevenLabs TTS failed, playing local fallback", err);
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
