import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SpeechContext = createContext(null);

export function SpeechProvider({ children }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [currentLabel, setCurrentLabel] = useState('');
  const utteranceRef = useRef(null);
  const location = useLocation();

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
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    // Try to find a Hindi voice
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang === 'hi-IN' || v.lang === 'hi');
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
