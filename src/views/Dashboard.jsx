import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, AlertTriangle, Leaf, Sprout, RefreshCw,
  ArrowRight, ImageOff, CheckCircle2, Beaker, Activity, TrendingUp,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { insightService, clearInsightCache } from '../services/insightService';
import TelemetryChart from '../components/TelemetryChart';
import useLiveWeather from '../hooks/useLiveWeather';

// ── Progressive loader ────────────────────────────────────────────────────────
const LOAD_STEPS = [
  'Connecting to your farm records...',
  'Loading crop health data...',
  'Cross-referencing field analyses...',
  'Compiling your field overview...',
  'Almost ready...',
];

function ProgressiveLoader() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep(s => Math.min(s + 1, LOAD_STEPS.length - 1)), 800);
    return () => clearInterval(id);
  }, []);
  const pct = Math.round(((step + 1) / LOAD_STEPS.length) * 100);
  return (
    <div className="flex flex-col items-center justify-center py-28 px-6 gap-8">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-[#111A11] border border-[#1C2A1C] flex items-center justify-center">
          <Leaf className="w-7 h-7 text-green-500 animate-pulse" />
        </div>
        <div className="absolute inset-0 border-2 border-green-500/20 border-t-green-500 rounded-2xl animate-spin" />
      </div>
      <div className="w-full max-w-xs">
        <div className="h-1 bg-[#1C2A1C] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="text-sm font-semibold text-gray-400 text-center"
        >
          {LOAD_STEPS[step]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * score) / 10;
  const color = score >= 8 ? '#22c55e' : score >= 5 ? '#f59e0b' : '#ef4444';
  return (
    <svg width="42" height="42" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="21" cy="21" r={r} stroke="#1C2A1C" strokeWidth="4" fill="none" />
      <motion.circle
        cx="21" cy="21" r={r} stroke={color} strokeWidth="4" fill="none"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        strokeLinecap="round"
      />
      <text
        x="21" y="21" textAnchor="middle" dominantBaseline="middle"
        style={{ transform: 'rotate(90deg)', transformOrigin: '21px 21px', fontSize: '10px', fontWeight: 700, fill: color }}
      >
        {score}
      </text>
    </svg>
  );
}

// ── Field card ────────────────────────────────────────────────────────────────
function FieldCard({ card }) {
  const sc = {
    green: { badge: 'text-green-400 bg-green-500/10 border-green-500/20', border: 'border-[#1C2A1C]' },
    amber: { badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20', border: 'border-amber-900/30' },
    red: { badge: 'text-red-400 bg-red-500/10 border-red-500/20', border: 'border-red-900/30' },
  }[card.status.color] || { badge: 'text-green-400 bg-green-500/10 border-green-500/20', border: 'border-[#1C2A1C]' };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`bg-[#0D150D] border ${sc.border} rounded-2xl p-5 shadow-sm flex flex-col gap-3`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {card.imageUrl ? (
            <img src={card.imageUrl} alt={card.crop} className="w-9 h-9 rounded-xl object-cover shrink-0 border border-[#1C2A1C]" onError={e => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-[#111A11] border border-[#1C2A1C] flex items-center justify-center shrink-0">
              <Sprout className="w-4 h-4 text-green-600" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-white font-bold text-sm truncate">{card.crop}</h3>
            {card.soil && <p className="text-[10px] text-gray-500 truncate">{card.soil}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.way === 1 ? 'text-green-500 bg-green-500/10 border-green-500/20' : 'text-sky-400 bg-sky-500/10 border-sky-500/20'}`}>
            {card.way === 1 ? 'Farm' : 'Detected'}
          </span>
          <ScoreRing score={card.healthScore} />
        </div>
      </div>

      <span className={`self-start text-xs font-bold px-2.5 py-1 rounded-lg border ${sc.badge}`}>
        {card.status.label}
      </span>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'TEMP', value: card.temperature },
          { label: 'pH', value: card.pH },
          { label: 'COMPAT.', value: card.compatibility ? card.compatibility.replace(' Suitable', '') : '–', loading: card.loadingCompatibility },
        ].map(({ label, value, loading }) => (
          <div key={label} className="bg-[#111A11] rounded-xl py-2 border border-[#1C2A1C]">
            <p className="text-[9px] font-bold text-green-500 uppercase tracking-wider mb-0.5">{label}</p>
            {loading ? (
              <div className="flex items-center justify-center gap-0.5 h-[18px]">
                {[0, 150, 300].map(d => (
                  <div key={d} className="w-1 h-1 rounded-full bg-green-500/60 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            ) : (
              <p className="text-xs font-bold text-white leading-tight">{value}</p>
            )}
          </div>
        ))}
      </div>

      {card.summary && (
        <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2 italic">"{card.summary}"</p>
      )}

      {!card.hasFullAnalysis && (
        <NavLink to="/try-new" className="flex items-center gap-1.5 text-[11px] font-bold text-green-500/70 hover:text-green-400 transition-colors">
          Run Try New Crop for full analysis <ArrowRight className="w-3 h-3" />
        </NavLink>
      )}
    </motion.div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#111A11] border border-[#1C2A1C] flex items-center justify-center">
        <ImageOff className="w-7 h-7 text-gray-600" />
      </div>
      <div>
        <p className="text-white font-bold text-base mb-1">No field data yet</p>
        <p className="text-gray-500 text-sm max-w-xs">
          Register a farm, upload a crop image, or run Try New Crop to populate your dashboard.
        </p>
      </div>
      <div className="flex gap-3 flex-wrap justify-center">
        <NavLink to="/try-new" className="flex items-center gap-1.5 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-xs font-bold rounded-xl transition-all">
          <Sprout className="w-3.5 h-3.5" /> Try New Crop
        </NavLink>
        <NavLink to="/diagnostic" className="flex items-center gap-1.5 px-4 py-2 bg-[#111A11] hover:bg-[#1C2A1C] border border-[#1C2A1C] text-gray-300 text-xs font-bold rounded-xl transition-all">
          <Activity className="w-3.5 h-3.5" /> Detect Disease
        </NavLink>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: weatherData, loading: weatherLoading } = useLiveWeather();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [showAllCharts, setShowAllCharts] = useState(false);
  const [loadingMoreCharts, setLoadingMoreCharts] = useState(false);

  const handleShowMoreCharts = () => {
    setLoadingMoreCharts(true);
    setTimeout(() => {
      setShowAllCharts(true);
      setLoadingMoreCharts(false);
    }, 1200);
  };

  const loadCards = useCallback(async (force = false) => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setError(false);
    if (force) clearInsightCache(user.$id);
    try {
      const result = await insightService.buildDashboardCards(user.$id, {
        currentTemp: weatherData?.currentTemp ?? null,
        condition: weatherData?.condition ?? 'Unknown',
        onCardUpdate: (updated) => setCards(prev => prev.map(c => c.id === updated.id ? updated : c)),
      });
      setCards(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user, weatherData, authLoading]);

  useEffect(() => { loadCards(); }, [loadCards]);

  const threatCards = cards.filter(c => c.status.color !== 'green');
  const avgHealthScore = cards.length > 0 ? cards.reduce((sum, c) => sum + c.healthScore, 0) / cards.length : null;
  const healthPct = avgHealthScore != null ? Math.round((avgHealthScore / 10) * 100) : null;

  const isInitialLoad = (authLoading || loading || weatherLoading) && cards.length === 0 && !error;

  if (isInitialLoad) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] w-full">
        <ProgressiveLoader />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Farmer Dashboard</h1>
          <p className="text-gray-400 mt-1 text-sm">Live field overview compiled from your farms, images, and analyses</p>
        </div>
        <button
          onClick={() => loadCards(true)} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#1C2A1C] text-gray-300 hover:text-white hover:bg-[#111A11] transition-all font-semibold text-sm disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: ShieldCheck, iconColor: 'text-green-500', label: 'Field Health', value: healthPct != null ? `${healthPct}% Healthy` : 'No data', isLoading: loading },
          { icon: Beaker, iconColor: 'text-blue-400', label: 'Crops Tracked', value: `${cards.length} crop${cards.length !== 1 ? 's' : ''}`, isLoading: loading },
          { icon: TrendingUp, iconColor: 'text-orange-400', label: 'Live Temp', value: weatherData ? `${weatherData.currentTemp}°C` : '—', highlight: true, isLoading: weatherLoading },
          { icon: AlertTriangle, iconColor: 'text-red-500', label: 'Active Threats', value: threatCards.length > 0 ? `${threatCards.length} Active` : 'None', valueColor: threatCards.length > 0 ? 'text-red-500' : 'text-white', isLoading: loading },
        ].map(({ icon: Icon, iconColor, label, value, highlight, valueColor = 'text-white', isLoading }) => (
          <div key={label} className={`${highlight ? 'bg-[#111A11] border-green-900/50' : 'bg-[#0D150D] border-[#1C2A1C]'} border rounded-2xl p-5 flex items-center gap-4 shadow-sm relative overflow-hidden`}>
            {highlight && <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />}
            <div className={`${highlight ? 'bg-[#1A251A] border-green-900/50' : 'bg-[#111A11] border-[#1C2A1C]'} p-3 rounded-xl border relative z-10`}>
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div className="relative z-10">
              <div className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">{label}</div>
              {isLoading ? (
                <div className="flex items-center gap-1 h-[32px]">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="w-1.5 h-1.5 rounded-full bg-green-500/60 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              ) : (
                <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — Field overview */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white">Field Overview</h2>
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#0D150D] border border-red-900/30 rounded-2xl p-8 text-center space-y-4">
                <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
                <p className="text-white font-bold">Could not load your field data.</p>
                <p className="text-gray-500 text-sm">Check your connection and try again.</p>
                <button onClick={() => loadCards(true)} className="px-5 py-2 bg-[#111A11] hover:bg-[#1C2A1C] border border-[#1C2A1C] text-gray-300 hover:text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 mx-auto">
                  <RefreshCw className="w-4 h-4" /> Retry
                </button>
              </motion.div>
            ) : cards.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#0D150D] border border-[#1C2A1C] rounded-2xl">
                <EmptyState />
              </motion.div>
            ) : (
              <motion.div key="cards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map(card => <FieldCard key={card.id} card={card} />)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right — Threats + Recommendations */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <h2 className="text-lg font-bold text-white">Active Crop Threats</h2>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="bg-[#0D150D] border border-[#1C2A1C] rounded-xl h-16 animate-pulse" />)}
              </div>
            ) : threatCards.length === 0 ? (
              <div className="bg-[#0D150D] border border-[#1C2A1C] rounded-xl p-5 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <p className="text-sm text-gray-400 font-medium">No active threats detected.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {threatCards.map(card => (
                  <div key={card.id} className="bg-[#1A1510] border border-orange-900/30 rounded-xl p-4 flex gap-3">
                    <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-white mb-0.5">{card.crop}</h4>
                      <p className="text-xs text-gray-400 leading-snug">{card.status.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!loading && cards.some(c => c.recommendations?.length > 0) && (
            <div>
              <h2 className="text-lg font-bold text-white mb-3">Field Recommendations</h2>
              <div className="bg-[#0D150D] border border-[#1C2A1C] rounded-2xl p-5 space-y-4">
                {cards
                  .filter(c => c.recommendations?.length > 0)
                  .flatMap(c => c.recommendations.map((r, i) => ({ crop: c.crop, text: r, key: `${c.id}-${i}` })))
                  .slice(0, 4)
                  .map((item, idx) => (
                    <div key={item.key} className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-[#1A251A] border border-[#1C2A1C] flex items-center justify-center text-xs font-bold text-green-500 shrink-0">{idx + 1}</div>
                      <div>
                        <span className="text-[16px] font-bold text-green-500 ">{item.crop} · </span>
                        <span className="text-sm text-gray-300">{item.text}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {!loading && cards.length === 0 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-3">Get Started</h2>
              <div className="bg-[#0D150D] border border-[#1C2A1C] rounded-2xl p-5 space-y-3">
                {[
                  { to: '/try-new', icon: Sprout, label: 'Check crop suitability', color: 'text-green-400' },
                  { to: '/diagnostic', icon: Activity, label: 'Upload a crop image', color: 'text-blue-400' },
                  { to: '/nutrient-analysis', icon: Beaker, label: 'Run nutrition analysis', color: 'text-purple-400' },
                ].map(({ to, icon: Icon, label, color }) => (
                  <NavLink key={to} to={to} className="flex items-center gap-3 py-2 hover:opacity-80 transition-opacity">
                    <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                    <span className="text-sm text-gray-300 font-medium">{label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-600 ml-auto" />
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Telemetry Trends Section */}
      {!loading && cards.length > 0 && weatherData?.fullHourlyData && (
        <div className="pt-6 border-t border-[#1C2A1C] space-y-6">
          <h2 className="text-xl font-black text-white">Your Farms Crop Growth Tracking</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TelemetryChart cropName={cards[0].crop} fullHourlyData={weatherData.fullHourlyData} />
            
            <AnimatePresence>
              {showAllCharts && cards.slice(1).map(card => (
                 <motion.div key={card.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
                   <TelemetryChart cropName={card.crop} fullHourlyData={weatherData.fullHourlyData} />
                 </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {cards.length > 1 && !showAllCharts && (
             <div className="flex justify-center pt-2">
                <button 
                  onClick={handleShowMoreCharts}
                  disabled={loadingMoreCharts}
                  className="relative overflow-hidden px-6 py-3 rounded-xl border border-blue-900/50 bg-[#0D150D] text-blue-400 font-bold group transition-all"
                >
                  {/* Water flow hover animation */}
                  <div className="absolute top-0 bottom-0 left-[-100%] w-[200%] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                  
                  <span className="relative z-10 flex items-center gap-2">
                    {loadingMoreCharts ? (
                      <>
                        <div className="flex gap-1 h-[24px] items-center">
                           {[0, 150, 300].map(d => (
                              <div key={d} className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                           ))}
                        </div>
                        Loading Tracking...
                      </>
                    ) : (
                      "Show More Tracking"
                    )}
                  </span>
                </button>
             </div>
          )}
        </div>
      )}

    </div>
  );
}
