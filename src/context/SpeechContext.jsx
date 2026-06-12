import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SpeechContext = createContext(null);

export function SpeechProvider({ children }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [currentLabel, setCurrentLabel] = useState('');
  const [isHindiAvailable, setIsHindiAvailable] = useState(false);
  const utteranceRef = useRef(null);
  const location = useLocation();

  // Detect Hindi voice availability on mount and whenever voices list changes
  useEffect(() => {
    const checkHindi = () => {
      const voices = window.speechSynthesis.getVoices();
      const found = voices.some(v => v.lang === 'hi-IN' || v.lang === 'hi' || v.lang.startsWith('hi'));
      setIsHindiAvailable(found);
    };
    checkHindi();
    window.speechSynthesis.onvoiceschanged = checkHindi;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Stop speech whenever the route changes
  useEffect(() => {
    stopSpeech();
  }, [location.pathname]);

  const stopSpeech = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setIsVisible(false);
    setCurrentText('');
    setCurrentLabel('');
    utteranceRef.current = null;
  }, []);

  const speak = useCallback((text, label = 'AI Response') => {
    if (!text) return;
    // Stop any existing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.88;
    utterance.pitch = 1.0;

    const assignVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      // Prefer hi-IN, then hi, then any Devanagari-compatible voice
      const hindiVoice =
        voices.find(v => v.lang === 'hi-IN') ||
        voices.find(v => v.lang === 'hi') ||
        voices.find(v => v.lang.startsWith('hi'));
      if (hindiVoice) utterance.voice = hindiVoice;

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
      setCurrentText(text);
      setCurrentLabel(label);
      setIsVisible(true);
      setIsPlaying(true);
      setIsPaused(false);
      window.speechSynthesis.speak(utterance);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      assignVoiceAndSpeak();
    } else {
      // Wait for voices to load (first time on Chrome/Edge)
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        assignVoiceAndSpeak();
      };
    }
  }, []);

  const pauseSpeech = useCallback(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  }, []);

  const resumeSpeech = useCallback(() => {
    if (window.speechSynthesis.paused) {
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
