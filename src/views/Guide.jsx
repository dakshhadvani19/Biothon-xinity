import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { imageService } from '../services/imageService';
import { diagnosticService } from '../services/diagnosticService';
import { farmService } from '../services/farmService';
import {
  FlaskConical, Lock, Images, CheckSquare, Square, Loader2,
  ChevronRight, RotateCcw, Leaf, Sprout, Droplets, Zap,
  AlertTriangle, CheckCircle2, CalendarDays, Beaker, Mountain, Tractor
} from 'lucide-react';

// ─── Severity badge ───────────────────────────────────────────────────────────
const SeverityBadge = ({ severity }) => {
  const map = {
    High:     'bg-red-100 text-red-600 border-red-200',
    Moderate: 'bg-amber-100 text-amber-600 border-amber-200',
    Low:      'bg-green-100 text-green-600 border-green-200',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${map[severity] ?? map.Low}`}>
      {severity ?? 'Unknown'}
    </span>
  );
};

// ─── NPK gauge bar ────────────────────────────────────────────────────────────
const NPKBar = ({ label, value, unit, tip, color }) => {
  const max = { Nitrogen: 200, Phosphorus: 100, Potassium: 120 }[label] ?? 150;
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colors = {
    Nitrogen:   { bar: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
    Phosphorus: { bar: 'bg-blue-500',    bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-100' },
    Potassium:  { bar: 'bg-purple-500',  bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-100' },
  }[label] ?? { bar: 'bg-gray-400', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100' };
  return (
    <div className={`${colors.bg} border ${colors.border} rounded-2xl p-4 space-y-2`}>
      <div className="flex justify-between items-center">
        <span className={`font-bold text-sm ${colors.text}`}>{label} (N)</span>
        <span className={`font-extrabold text-lg ${colors.text}`}>
          {value !== undefined ? value : '--'} <span className="text-xs font-normal">{unit ?? ''}</span>
        </span>
      </div>
      <div className="h-2 bg-white/60 rounded-full overflow-hidden border border-white">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          className={`h-full ${colors.bar} rounded-full`}
        />
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{tip}</p>
    </div>
  );
};

// ─── Individual result card ───────────────────────────────────────────────────
const ResultCard = ({ result, index }) => {
  const [tab, setTab] = useState('npk');
  const tabs = [
    { id: 'npk',     label: 'NPK',       icon: Beaker },
    { id: 'organic', label: 'Organic',   icon: Leaf },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden"
    >
      {/* Top strip */}
      <div className="h-1 w-full bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400" />

      {/* Header */}
      <div className="p-6 flex flex-col sm:flex-row gap-4">
        {result.image_url && (
          <img
            src={result.image_url}
            alt="Crop scan"
            className="w-24 h-24 object-cover rounded-2xl border border-gray-100 shadow-sm flex-shrink-0"
          />
        )}
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-xl font-extrabold text-gray-900 leading-tight">{result.crop_label ?? result.raw_disease}</h3>
            <SeverityBadge severity={result.severity} />
          </div>
          {result.summary && (
            <p className="text-gray-500 text-sm leading-relaxed">{result.summary}</p>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-t border-gray-100 bg-gray-50/60">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors ${
                active ? 'text-green-600 border-b-2 border-green-500 bg-white' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {tab === 'npk' && result.npk && (
            <motion.div key="npk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid gap-3">
              <NPKBar label="Nitrogen"   {...result.npk.nitrogen}   />
              <NPKBar label="Phosphorus" {...result.npk.phosphorus} />
              <NPKBar label="Potassium"  {...result.npk.potassium}  />
            </motion.div>
          )}
          {tab === 'organic' && (
            <motion.div key="organic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {(result.organic_amendments ?? []).map((a, i) => (
                <div key={i} className="flex items-start gap-3 bg-green-50/60 border border-green-100 rounded-2xl p-4">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <p className="text-sm text-gray-700 leading-relaxed">{a}</p>
                </div>
              ))}
              {(!result.organic_amendments || result.organic_amendments.length === 0) && (
                <p className="text-gray-400 text-sm text-center py-4">No organic amendments data available.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ─── Progressive Loader ───────────────────────────────────────────────────────
const ProgressiveLoader = () => {
  const [textIndex, setTextIndex] = useState(0);
  
  // Need to wrap messages in a ref or just recreate them
  const messages = [
    "Establishing secure link to Agronomic AI...",
    "Analyzing soil and crop parameters...",
    "Calculating precise NPK requirements...",
    "Formulating organic amendments...",
    "Finalising custom nutrition guide..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-xl mx-auto py-28 flex flex-col items-center gap-10">
      {/* Beautiful Circular Loader */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        {/* Outer glowing ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-emerald-500 border-r-emerald-500 opacity-90 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        />
        {/* Middle pulsing ring */}
        <motion.div
          animate={{ rotate: -360, scale: [1, 1.05, 1] }}
          transition={{ rotate: { repeat: Infinity, duration: 4, ease: 'linear' }, scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' } }}
          className="absolute inset-3 rounded-full border-[3px] border-transparent border-b-green-400 border-l-green-400 opacity-70"
        />
        {/* Inner static icon */}
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="bg-gradient-to-br from-green-50 to-emerald-100 w-14 h-14 rounded-full flex items-center justify-center shadow-inner border border-green-200"
        >
          <Sprout className="w-7 h-7 text-emerald-600" strokeWidth={2.5} />
        </motion.div>
      </div>

      <div className="text-center space-y-4 h-16">
        <p className="font-extrabold text-gray-800 text-2xl tracking-tight">Generating your guide</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={textIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
            className="text-emerald-700 text-sm font-bold bg-emerald-50 inline-block px-5 py-2 rounded-full border border-emerald-100 shadow-sm"
          >
            {messages[textIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="flex gap-2 pt-4">
        {['Diagnoses', '→', 'Agronomic AI', '→', 'Guide'].map((s, i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
            className="text-xs text-gray-400 font-bold uppercase tracking-wider"
          >
            {s}
          </motion.span>
        ))}
      </div>
    </div>
  );
};


// ─── Main Guide component ─────────────────────────────────────────────────────
export default function Guide() {
  const { user, loginWithGoogle, isLoading } = useAuth();
  const [view, setView]             = useState('idle');
  const [images, setImages]         = useState([]);
  const [diagLogs, setDiagLogs]     = useState([]); // diagnostic_logs for this user
  const [farms, setFarms]           = useState([]);
  const [selected, setSelected]     = useState(new Set());
  const [selectedFarms, setSelectedFarms] = useState(new Set());
  const [results, setResults]       = useState([]);
  const [fetchingImages, setFetchingImages] = useState(false);
  const [fetchingFarms, setFetchingFarms] = useState(false);
  const [error, setError]           = useState(null);

  const apiBase = import.meta.env.DEV
    ? 'http://127.0.0.1:8000'
    : 'https://biothon-xinity-vercel.vercel.app';

  // Load gallery + diagnostic logs simultaneously
  const openGallery = async () => {
    setView('gallery');
    setFetchingImages(true);
    const [imgs, logs] = await Promise.all([
      imageService.getUserImages(user.$id),
      diagnosticService.getUserDiagnosticLogs(user.$id),
    ]);
    setImages(imgs);
    setDiagLogs(logs);
    setFetchingImages(false);
  };

  const openFarmGallery = async () => {
    setView('farm_gallery');
    setFetchingFarms(true);
    const f = await farmService.getUserFarms(user.$id);
    setFarms(f);
    setFetchingFarms(false);
  };

  const toggle = (id) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleFarm = (id) => {
    setSelectedFarms(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const selectAll   = () => setSelected(new Set(images.map(i => i.$id)));
  const deselectAll = () => setSelected(new Set());

  const selectAllFarms   = () => setSelectedFarms(new Set(farms.map(f => f.$id)));
  const deselectAllFarms = () => setSelectedFarms(new Set());

  const handleAnalyze = async () => {
    const chosen = images.filter(i => selected.has(i.$id));
    if (!chosen.length) return;
    setView('loading');
    setError(null);
    try {
      const diagnoses = chosen.map(img => {
        const log = diagLogs.find(l => l.image_id === img.file_id);
        return {
          file_id:    img.file_id,
          image_url:  img.image_url,
          disease:    log?.disease    ?? 'Unknown Crop Condition',
          confidence: log ? Number(log.confidence) / 100 : 0.5,
        };
      });

      const res = await fetch(`${apiBase}/api/v1/nutrition-guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagnoses }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setView('results');
    } catch (e) {
      setError(e.message);
      setView('gallery');
    }
  };

  const handleFarmAnalyze = async () => {
    const chosen = farms.filter(f => selectedFarms.has(f.$id));
    if (!chosen.length) return;
    setView('loading');
    setError(null);
    try {
      const payload = chosen.map(f => ({
        farm_id: f.$id,
        crop: f.crop,
        soil: f.soil
      }));

      const res = await fetch(`${apiBase}/api/v1/farm-nutrition-guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farms: payload }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setView('results');
    } catch (e) {
      setError(e.message);
      setView('farm_gallery');
    }
  };

  // ── Auth loading — prevent flash of sign-in screen on refresh ───────────────
  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto py-32 flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-[3px] border-green-100 border-t-green-500 animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading your profile…</p>
      </div>
    );
  }

  // ── Unauthenticated ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 flex flex-col items-center text-center space-y-6">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 shadow-inner"
        >
          <FlaskConical className="w-10 h-10 text-emerald-600" strokeWidth={2} />
        </motion.div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Nutrition Guide</h1>
          <p className="text-gray-500 text-sm mt-2 leading-relaxed max-w-xs mx-auto">
            Sign in to analyse your crop scans and get personalised NPK + organic amendment plans.
          </p>
        </div>
        <button
          onClick={loginWithGoogle}
          className="w-full max-w-xs bg-white border-2 border-gray-200 text-gray-700 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all google-border-hover"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    );
  }

  // ── Idle: dual entry cards ─────────────────────────────────────────────────
  if (view === 'idle') {
    return (
      <div className="max-w-3xl mx-auto py-12 space-y-8 px-4">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Nutrition Guide</h1>
          <p className="text-gray-500 text-sm">AI-powered NPK & organic amendment plans for your crops.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* By Image */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openGallery}
            className="w-full bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-dashed border-green-200 rounded-3xl p-8 flex flex-col items-center gap-5 hover:border-green-300 hover:shadow-xl transition-all group"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
              className="bg-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg border border-green-100 group-hover:scale-110 transition-transform"
            >
              <Images className="w-8 h-8 text-green-600" strokeWidth={2} />
            </motion.div>
            <div className="text-center">
              <p className="text-lg font-extrabold text-gray-800 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                Browse My Scans
              </p>
              <p className="text-gray-500 text-sm mt-1 leading-snug">Generate plans based on diagnosed diseases</p>
            </div>
            <span className="flex items-center gap-1 text-green-600 font-semibold text-sm mt-2">
              Open Gallery <ChevronRight className="w-4 h-4" />
            </span>
          </motion.button>

          {/* By Farm */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openFarmGallery}
            className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-200 rounded-3xl p-8 flex flex-col items-center gap-5 hover:border-blue-300 hover:shadow-xl transition-all group"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="bg-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg border border-blue-100 group-hover:scale-110 transition-transform"
            >
              <Tractor className="w-8 h-8 text-blue-600" strokeWidth={2} />
            </motion.div>
            <div className="text-center">
              <p className="text-lg font-extrabold text-gray-800 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Select My Farms
              </p>
              <p className="text-gray-500 text-sm mt-1 leading-snug">Generate crop-specific plans for your soil types</p>
            </div>
            <span className="flex items-center gap-1 text-blue-600 font-semibold text-sm mt-2">
              View Farms <ChevronRight className="w-4 h-4" />
            </span>
          </motion.button>
        </div>
      </div>
    );
  }

  // ── Gallery: select images ──────────────────────────────────────────────────
  if (view === 'gallery') {
    return (
      <div className="max-w-4xl mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">My Crop Scans</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {fetchingImages ? 'Loading your scans…' : `${images.length} scan${images.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selected.size > 0 && (
              <span className="bg-green-100 text-green-700 font-bold text-sm px-3 py-1.5 rounded-full">
                {selected.size} selected
              </span>
            )}
            <button onClick={() => setView('idle')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-colors font-medium">
              <RotateCcw className="w-4 h-4" /> Back
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-700 text-sm font-medium">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Controls bar */}
        {!fetchingImages && images.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center bg-white/70 backdrop-blur-sm border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
            {(() => {
              const allSelected = images.length > 0 && selected.size === images.length;
              return (
                <button
                  onClick={allSelected ? deselectAll : selectAll}
                  className={`flex items-center gap-2 text-sm font-semibold transition-colors px-3 py-1.5 rounded-xl ${
                    allSelected
                      ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
                      : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                  }`}
                >
                  {allSelected
                    ? <><Square className="w-4 h-4" /> Deselect All</>
                    : <><CheckSquare className="w-4 h-4 text-green-500" /> Select All</>
                  }
                </button>
              );
            })()}
            <span className="text-xs text-gray-400 ml-auto">Tap to select · Tap again to deselect</span>
          </div>
        )}

        {/* Photo Album Grid */}
        {fetchingImages ? (
          // Skeleton loaders in album style
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl animate-pulse"
                style={{ animationDelay: `${i * 0.05}s` }}
              />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
              <Sprout className="w-10 h-10 text-gray-300" />
            </div>
            <div>
              <p className="font-bold text-gray-600">No crop scans found</p>
              <p className="text-sm text-gray-400 mt-1">Use the Diagnostic tab to scan a leaf first.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {images.map((img, idx) => {
              const isSelected = selected.has(img.$id);
              return (
                <motion.button
                  key={img.$id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03, duration: 0.25 }}
                  onClick={() => toggle(img.$id)}
                  whileTap={{ scale: 0.93 }}
                  className={`relative aspect-square rounded-2xl overflow-hidden transition-all duration-200 ${
                    isSelected
                      ? 'ring-3 ring-green-500 ring-offset-2 shadow-lg shadow-green-200/60'
                      : 'ring-1 ring-gray-200 hover:ring-2 hover:ring-gray-300 hover:shadow-md'
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt={`Crop scan ${idx + 1}`}
                    className={`w-full h-full object-cover transition-all duration-300 ${isSelected ? 'brightness-90' : 'hover:scale-105'}`}
                    loading="lazy"
                    onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f3f4f6" width="100" height="100"/><text y="50%" x="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="12">Error</text></svg>'; }}
                  />

                  {/* Selection overlay */}
                  <div className={`absolute inset-0 transition-all duration-200 ${isSelected ? 'bg-green-500/15' : 'bg-transparent'}`} />

                  {/* Checkmark badge */}
                  <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-sm transition-all duration-200 ${
                    isSelected ? 'bg-green-500 border-green-500 scale-110' : 'bg-white/90 border-gray-300'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />}
                  </div>

                  {/* Index number on unselected */}
                  {!isSelected && (
                    <div className="absolute bottom-1.5 left-1.5 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      #{idx + 1}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Sticky confirm bar */}
        <div className={`sticky bottom-4 transition-all duration-300 ${selected.size === 0 ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <motion.button
            onClick={handleAnalyze}
            disabled={selected.size === 0}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-2xl shadow-xl shadow-green-500/25 hover:shadow-green-500/40 transition-all flex items-center justify-center gap-3 text-lg"
          >
            <FlaskConical className="w-5 h-5" />
            Confirm — Guide Me
            {selected.size > 0 && (
              <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-sm font-bold">
                {selected.size} image{selected.size !== 1 ? 's' : ''}
              </span>
            )}
          </motion.button>
        </div>
      </div>
    );
  }

  // ── Farm Gallery: select farms ──────────────────────────────────────────────
  if (view === 'farm_gallery') {
    return (
      <div className="max-w-4xl mx-auto py-6 space-y-6 px-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">My Farms</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {fetchingFarms ? 'Loading your farms…' : `${farms.length} farm${farms.length !== 1 ? 's' : ''} found`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedFarms.size > 0 && (
              <span className="bg-blue-100 text-blue-700 font-bold text-sm px-3 py-1.5 rounded-full">
                {selectedFarms.size} selected
              </span>
            )}
            <button onClick={() => setView('idle')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-colors font-medium">
              <RotateCcw className="w-4 h-4" /> Back
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 text-red-700 text-sm font-medium">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Controls bar */}
        {!fetchingFarms && farms.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center bg-white/70 backdrop-blur-sm border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
            {(() => {
              const allSelected = farms.length > 0 && selectedFarms.size === farms.length;
              return (
                <button
                  onClick={allSelected ? deselectAllFarms : selectAllFarms}
                  className={`flex items-center gap-2 text-sm font-semibold transition-colors px-3 py-1.5 rounded-xl ${
                    allSelected
                      ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {allSelected
                    ? <><Square className="w-4 h-4" /> Deselect All</>
                    : <><CheckSquare className="w-4 h-4 text-blue-500" /> Select All</>
                  }
                </button>
              );
            })()}
            <span className="text-xs text-gray-400 ml-auto">Tap to select · Tap again to deselect</span>
          </div>
        )}

        {/* Farm List Grid (Vertical, 2 columns) */}
        {fetchingFarms ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl animate-pulse"
                style={{ animationDelay: `${i * 0.05}s` }}
              />
            ))}
          </div>
        ) : farms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
              <Tractor className="w-10 h-10 text-gray-300" />
            </div>
            <div>
              <p className="font-bold text-gray-600">No farms found</p>
              <p className="text-sm text-gray-400 mt-1">Add your farms in the Profile tab first.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {farms.map((farm, idx) => {
              const isSelected = selectedFarms.has(farm.$id);
              return (
                <motion.button
                  key={farm.$id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03, duration: 0.25 }}
                  onClick={() => toggleFarm(farm.$id)}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-5 rounded-2xl border text-left transition-all duration-200 ${
                    isSelected
                      ? 'bg-blue-50/50 border-blue-500 shadow-md shadow-blue-200/50'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        <Sprout className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-emerald-500'}`} />
                        {farm.crop}
                      </h3>
                      <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                        <Mountain className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-amber-500'}`} />
                        {farm.soil} Soil
                      </p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-sm transition-all duration-200 flex-shrink-0 ${
                      isSelected ? 'bg-blue-500 border-blue-500' : 'bg-gray-50 border-gray-300'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Sticky confirm bar */}
        <div className={`sticky bottom-4 transition-all duration-300 ${selectedFarms.size === 0 ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <motion.button
            onClick={handleFarmAnalyze}
            disabled={selectedFarms.size === 0}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-3 text-lg"
          >
            <Tractor className="w-5 h-5" />
            Confirm — Guide Me
            {selectedFarms.size > 0 && (
              <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-sm font-bold">
                {selectedFarms.size} farm{selectedFarms.size !== 1 ? 's' : ''}
              </span>
            )}
          </motion.button>
        </div>
      </div>
    );
  }


  // ── Loading ─────────────────────────────────────────────────────────────────
  if (view === 'loading') {
    return <ProgressiveLoader />;
  }

  // ── Results ─────────────────────────────────────────────────────────────────
  if (view === 'results') {
    return (
      <div className="max-w-2xl mx-auto py-6 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Your Nutrition Guide</h1>
            <p className="text-gray-500 text-sm mt-0.5">{results.length} personalised plan{results.length !== 1 ? 's' : ''} generated</p>
          </div>
          <button
            onClick={() => { setView('gallery'); setResults([]); setSelected(new Set()); }}
            className="flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Analyse More
          </button>
        </div>
        <div className="space-y-6">
          {results.map((r, i) => <ResultCard key={i} result={r} index={i} />)}
        </div>
      </div>
    );
  }

  return null;
}
