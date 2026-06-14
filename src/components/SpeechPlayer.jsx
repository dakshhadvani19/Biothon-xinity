import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pause, Play, Square, Volume2, GripHorizontal } from 'lucide-react';
import { useSpeech } from '../context/SpeechContext';

export default function SpeechPlayer() {
  const { isVisible, isPlaying, isPaused, stopSpeech, pauseSpeech, resumeSpeech, currentLabel, isVoiceLoading } = useSpeech();

  // Draggable state
  const [pos, setPos] = useState({ x: 0, y: 0 }); // offset from center-top anchor
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const cardRef = useRef(null);

  const onMouseDown = useCallback((e) => {
    if (e.target.closest('button')) return; // don't drag if clicking a button
    e.preventDefault();
    setDragging(true);
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: pos.x,
      startY: pos.y,
    };
  }, [pos]);

  useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e) => {
      const dx = e.clientX - dragStart.current.mouseX;
      const dy = e.clientY - dragStart.current.mouseY;
      setPos({
        x: dragStart.current.startX + dx,
        y: dragStart.current.startY + dy,
      });
    };
    const onMouseUp = () => setDragging(false);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging]);

  // Reset position when player appears fresh
  useEffect(() => {
    if (isVisible) setPos({ x: 0, y: 0 });
  }, [isVisible]);

  // Waveform animation bars
  const bars = [3, 5, 8, 5, 9, 6, 4, 7, 5, 3, 8, 5];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: -30, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          style={{
            position: 'fixed',
            top: `${72 + pos.y}px`,
            left: `calc(50% + ${pos.x}px)`,
            transform: 'translateX(-50%)',
            zIndex: 9999,
            cursor: dragging ? 'grabbing' : 'grab',
            userSelect: 'none',
          }}
          onMouseDown={onMouseDown}
        >
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-2xl border border-green-200/60"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(240,253,244,0.97) 100%)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(34,197,94,0.18), 0 2px 8px rgba(0,0,0,0.10)',
              minWidth: '320px',
              maxWidth: '480px',
            }}
          >
            {/* Drag handle */}
            <GripHorizontal className="w-4 h-4 text-gray-300 shrink-0" />

            {/* Animated waveform / volume icon / loader */}
            <div className="flex items-center gap-0.5 shrink-0 justify-center w-[60px]">
              {isVoiceLoading ? (
                <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              ) : isPlaying ? (
                bars.map((h, i) => (
                  <motion.div
                    key={i}
                    className="w-[3px] rounded-full bg-green-500"
                    animate={{ height: [`${h * 2}px`, `${h * 3.5}px`, `${h * 2}px`] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.05,
                      ease: 'easeInOut',
                    }}
                    style={{ minWidth: '3px' }}
                  />
                ))
              ) : (
                <Volume2 className="w-5 h-5 text-green-500" />
              )}
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider leading-none mb-0.5">
                हिंदी ऑडियो
              </p>
              <p className="text-sm font-bold text-gray-800 truncate leading-tight">
                {currentLabel || 'AI प्रतिक्रिया'}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Pause / Resume */}
              {isPlaying ? (
                <button
                  onClick={pauseSpeech}
                  title="Pause"
                  className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 text-green-700 flex items-center justify-center transition-all active:scale-90"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : isPaused ? (
                <button
                  onClick={resumeSpeech}
                  title="Resume"
                  className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-all active:scale-90"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : null}

              {/* Stop */}
              <button
                onClick={stopSpeech}
                title="Stop"
                className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-all active:scale-90"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>

              {/* Close */}
              <button
                onClick={stopSpeech}
                title="Close"
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-all active:scale-90"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
