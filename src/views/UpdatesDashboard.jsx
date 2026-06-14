import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, CloudRain, Wind, Thermometer, Clock, Target, Lightbulb, Smartphone, Mail, Send, CheckCircle, ArrowRight, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useLiveWeather from '../hooks/useLiveWeather';
import { fetchAIInsights } from '../services/weatherService';
import WeatherBanner from '../components/WeatherBanner';
import { useAuth } from '../context/AuthContext';
import { farmService } from '../services/farmService';
import { aiService } from '../services/aiService';
import { useSpeech } from '../context/SpeechContext';

const COUNTRIES = [
    { name: 'India', code: '+91', flag: '🇮🇳' },
    { name: 'United States', code: '+1', flag: '🇺🇸' },
    { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
    { name: 'Canada', code: '+1', flag: '🇨🇦' },
    { name: 'Australia', code: '+61', flag: '🇦🇺' }
];

export default function UpdatesDashboard() {
  const { data, loading, error, refreshWeather, lastUpdated } = useLiveWeather();
  const { user } = useAuth();
  const { speak } = useSpeech();
  const [insights, setInsights] = useState([]);
  const [insightsHi, setInsightsHi] = useState([]);
  const [isInsightsLoading, setIsInsightsLoading] = useState(true);

  // Guest Direct Report Dispatcher States
  const [directEmail, setDirectEmail] = useState(localStorage.getItem('agrishield_direct_email') || '');
  const [directPhoneBody, setDirectPhoneBody] = useState(localStorage.getItem('agrishield_direct_phone_body') || '');
  const [directCountryCode, setDirectCountryCode] = useState('+91');
  const [directDeliveryMode, setDirectDeliveryMode] = useState('SMS');
  const [isDirectSending, setIsDirectSending] = useState(false);
  const [directResponse, setDirectResponse] = useState(null);
  const [directClientLinks, setDirectClientLinks] = useState(null);
  const [directPdfUrl, setDirectPdfUrl] = useState('');

  const handleDirectSend = async (e) => {
    if (e) e.preventDefault();
    if (!directEmail.trim()) {
      alert("Please enter a valid email address.");
      return;
    }
    if (!directPhoneBody.trim() || directPhoneBody.trim().length !== 10) {
      alert("Please enter a valid 10-digit mobile phone number.");
      return;
    }
    
    setIsDirectSending(true);
    setDirectResponse(null);
    setDirectClientLinks(null);
    setDirectPdfUrl('');
    try {
      const fullPhone = directCountryCode + directPhoneBody;

      const twilioSid = localStorage.getItem('agrishield_twilio_sid') || '';
      const twilioToken = localStorage.getItem('agrishield_twilio_token') || '';
      
      if (twilioSid && twilioToken) {
        try {
            const verification = await aiService.verifyPhoneNumber(fullPhone, twilioSid, twilioToken);
            if (!verification.valid) {
                alert(`Phone Verification Failed: ${verification.message}`);
                setIsDirectSending(false);
                return;
            }
        } catch (verifyErr) {
            console.error("Verification error:", verifyErr);
            alert("Failed to verify phone number with the backend.");
            setIsDirectSending(false);
            return;
        }
      }

      const payload = {
        email: directEmail,
        phone: fullPhone,
        delivery_mode: directDeliveryMode,
        enabled: true,
        lat: data?.currentTemp ? (data.lat || 22.3039) : 22.3039,
        lon: data?.currentTemp ? (data.lon || 70.8022) : 70.8022,
        crops: [],
        
        // Auto-fill credentials under the hood
        twilio_sid: localStorage.getItem('agrishield_twilio_sid') || '',
        twilio_token: localStorage.getItem('agrishield_twilio_token') || '',
        twilio_from: localStorage.getItem('agrishield_twilio_from') || '',
        custom_smtp_host: localStorage.getItem('agrishield_smtp_host') || '',
        custom_smtp_port: localStorage.getItem('agrishield_smtp_port') ? parseInt(localStorage.getItem('agrishield_smtp_port'), 10) : null,
        custom_smtp_user: localStorage.getItem('agrishield_smtp_user') || '',
        custom_smtp_pass: localStorage.getItem('agrishield_smtp_pass') || '',
        custom_smtp_from: localStorage.getItem('agrishield_smtp_from') || '',
        custom_telegram_bot_token: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '123456789:dummy_bot_token_alternative',
        custom_telegram_chat_id: import.meta.env.VITE_TELEGRAM_CHAT_ID || 'dummy_chat_id_alternative'
      };
      
      const result = await aiService.sendTestReport(payload);
      setDirectResponse(result);
      
      const ML_ENGINE = (import.meta.env.VITE_ML_ENGINE_URL || 'https://dakshhadvani19-agrishield.hf.space');
      const resolvedPdfUrl = `${ML_ENGINE}/api/v1/pdf/${directEmail}`;
      
      setDirectPdfUrl(resolvedPdfUrl);
      
      const bodyText = `AgriShield Crop Health Report for ${directEmail}: Here is your automated crop health PDF: ${resolvedPdfUrl}`;
      
      setDirectClientLinks({
        whatsapp: `https://api.whatsapp.com/send?phone=${encodeURIComponent(fullPhone)}&text=${encodeURIComponent(bodyText)}`,
        sms: `sms:${fullPhone}?body=${encodeURIComponent(bodyText)}`,
        email: `mailto:${directEmail}?subject=${encodeURIComponent("AgriShield Daily Crop Health & Action Advisory Report")}&body=${encodeURIComponent(bodyText)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(resolvedPdfUrl)}&text=${encodeURIComponent(bodyText)}`
      });
      
      localStorage.setItem('agrishield_direct_email', directEmail);
      localStorage.setItem('agrishield_direct_phone_body', directPhoneBody);
    } catch (err) {
      console.error("Direct send report error:", err);
      alert("Failed to request report from the server. Check if backend is active.");
    } finally {
      setIsDirectSending(false);
    }
  };



  useEffect(() => {
    const fetchInsights = async () => {
      if (data) {
        setIsInsightsLoading(true);
        try {
          let activeFarms = [];
          if (user) {
              activeFarms = await farmService.getUserFarms(user.$id);
          }
          const result = await fetchAIInsights(data, activeFarms);
          // Handle new bilingual format {insights_en, insights_hi} and old {insights}
          if (Array.isArray(result)) {
            setInsights(result);
            setInsightsHi([]);
          } else {
            setInsights(result.insights_en || result.insights || []);
            setInsightsHi(result.insights_hi || []);
          }
        } finally {
          setIsInsightsLoading(false);
        }
      }
    };
    fetchInsights();
  }, [data, user]);

  const formatTime = (epoch) => {
    return new Date(epoch).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastUpdated = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (loading && !data) {
    return (
      <div className="w-full max-w-6xl mx-auto space-y-6 animate-pulse p-4">
        <div className="h-32 bg-gray-200 rounded-2xl w-full"></div>
        <div className="h-16 bg-gray-200 rounded-xl w-full"></div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="min-w-[140px] h-40 bg-gray-200 rounded-2xl shrink-0"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 bg-red-50 text-red-700 rounded-2xl text-center border border-red-200 mt-4">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-bold mb-2">Telemetry Offline</h2>
        <p>Failed to load weather data. Please check your connection.</p>
        <button onClick={refreshWeather} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
          Retry Connection
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12 mt-4">
      <WeatherBanner />
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white tracking-tight">Weather & Farming Advisory</h1>
        <p className="text-gray-400 mt-1">Predictive microclimate analytics and adaptive farm activity planning</p>
      </div>

      <div className="bg-[#0D150D] rounded-2xl p-6 md:p-8 shadow-sm border border-[#1C2A1C] flex flex-col md:flex-row justify-between items-center md:items-start gap-6">
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="w-20 h-20 bg-[#111A11] border border-[#1C2A1C] rounded-2xl flex items-center justify-center text-blue-400 shadow-inner">
            <Thermometer className="w-10 h-10" />
          </div>
          <div>
            <div className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">Current Conditions</div>
            <h2 className="text-4xl font-extrabold text-white tracking-tight">
              {data.currentTemp}°C
            </h2>
            <p className="text-lg font-medium text-gray-300 mt-1">{data.condition}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-center md:items-end gap-3 mt-4 md:mt-0">
          <button 
            onClick={refreshWeather}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#111A11] border border-[#1C2A1C] text-gray-300 rounded-xl font-semibold hover:text-white hover:bg-[#1A251A] transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Syncing...' : 'Force Sync'}
          </button>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
            <Clock className="w-3.5 h-3.5" />
            Last Updated: {formatLastUpdated(lastUpdated)}
          </div>
        </div>
      </div>

      {/* Critical Alerts Section */}
      {data.alerts && data.alerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 px-1">Active Threat Intelligence</h2>
          {data.alerts.map((alert, idx) => (
            <div key={idx} className="bg-red-600 text-white rounded-2xl p-6 shadow-[0_0_25px_rgba(220,38,38,0.4)] animate-pulse border-2 border-red-400">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-8 h-8 shrink-0 mt-1 text-red-200" />
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-wide mb-2">{alert.event}</h3>
                  <p className="text-red-50 text-sm md:text-base leading-relaxed opacity-90 whitespace-pre-wrap">
                    {alert.desc || alert.headline}
                  </p>
                  <div className="mt-4 inline-block bg-red-900/50 px-4 py-2 rounded-lg text-sm font-bold border border-red-500/50">
                    SEVERITY: {alert.severity || 'EXTREME'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 48-Hour Forecast Timeline */}
      <div className="bg-[#0D150D] rounded-2xl p-6 md:p-8 shadow-sm border border-[#1C2A1C] mt-6">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-green-500" />
          48-Hour Atmospheric Forecast
        </h2>
        
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x relative custom-scrollbar">
          {data.hourlyForecast.map((hour, idx) => {
            const isImminentRain = hour.rainChance > 50;
            return (
              <div 
                key={idx} 
                className={`min-w-[140px] snap-start shrink-0 rounded-2xl p-5 border flex flex-col items-center text-center transition-all ${
                  isImminentRain 
                    ? 'bg-[#111A11] border-blue-900/50 shadow-sm' 
                    : 'bg-[#111A11] border-[#1C2A1C] hover:bg-[#1A251A]'
                }`}
              >
                <div className="text-green-500 text-sm font-bold mb-3">
                  {formatTime(hour.timestamp)}
                </div>
                <div className="text-3xl font-black text-white mb-4">
                  {hour.temp}°
                </div>
                
                <div className="w-full space-y-2">
                  <div className={`flex items-center justify-center gap-1.5 text-sm font-bold ${isImminentRain ? 'text-blue-400' : 'text-gray-400'}`}>
                    <CloudRain className="w-4 h-4" />
                    {hour.rainChance}%
                  </div>
                  <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-gray-400">
                    <Wind className="w-4 h-4" />
                    {hour.windSpeed}kph
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Agronomic Intelligence Advisory */}
      <div className="bg-[#0D150D] border border-[#1C2A1C] rounded-2xl p-6 shadow-sm mt-6">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-green-500" />
          Farming Task Advisories
        </h2>
        
        {isInsightsLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-4 bg-[#111A11] rounded w-full"></div>
            <div className="h-4 bg-[#111A11] rounded w-full"></div>
            <div className="h-4 bg-[#111A11] rounded w-3/4"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            {insights.map((insight, idx) => (
              <div key={idx} className="bg-[#111A11] rounded-xl p-4 border border-[#1C2A1C] flex flex-col gap-2">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-[#1A251A] border border-[#1C2A1C] flex items-center justify-center text-xs font-bold text-green-500 shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed mt-0.5">
                    {insight}
                  </p>
                </div>
                {insightsHi[idx] && (
                  <button
                    onClick={() => speak(insightsHi[idx], 'hi', `सलाह ${idx + 1}`)}
                    className="ml-10 self-start flex items-center gap-1.5 text-xs font-bold text-green-500 hover:text-green-400 bg-[#1A251A] px-2.5 py-1 rounded-lg transition-all active:scale-95 border border-[#1C2A1C] mt-1"
                    title="हिंदी में सुनें"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    हिंदी में सुनें
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Direct Report Dispatcher Widget */}
      <div className="bg-[#0D150D] border border-[#1C2A1C] rounded-2xl p-6 md:p-8 shadow-sm mt-6 space-y-6">
        <div className="border-b border-[#1C2A1C] pb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-500" />
            Direct Report Dispatcher (No Account Needed)
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Get the agricultural advisory report PDF dispatched directly to your mobile phone or email address instantly.
          </p>
        </div>

        <form onSubmit={handleDirectSend} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email field */}
            <div>
              <label htmlFor="direct-email" className="block text-xs font-bold text-green-500 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <input 
                  id="direct-email"
                  type="email" 
                  value={directEmail} 
                  onChange={(e) => setDirectEmail(e.target.value)} 
                  placeholder="e.g. farmer@agrishield.org" 
                  className="w-full bg-[#111A11] border border-[#1C2A1C] rounded-lg px-4 py-2.5 pl-10 focus:ring-1 focus:ring-green-500 text-white outline-none font-medium text-sm transition-colors" 
                  required
                />
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Phone Number Field */}
            <div>
              <label htmlFor="direct-phone" className="block text-xs font-bold text-green-500 uppercase tracking-wider mb-2">Mobile Phone Number</label>
              <div className="flex gap-2">
                <select
                  aria-label="Country Code"
                  value={directCountryCode}
                  onChange={(e) => setDirectCountryCode(e.target.value)}
                  className="bg-[#111A11] border border-[#1C2A1C] rounded-lg px-3 py-2.5 focus:ring-1 focus:ring-green-500 text-white outline-none font-semibold text-sm cursor-pointer"
                >
                  {COUNTRIES.map(c => (
                    <option key={`${c.code}-${c.name}`} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input 
                  id="direct-phone"
                  type="text" 
                  value={directPhoneBody} 
                  onChange={(e) => setDirectPhoneBody(e.target.value.replace(/\D/g, ''))} 
                  placeholder="e.g. 9876543210" 
                  maxLength="10"
                  className="flex-1 bg-[#111A11] border border-[#1C2A1C] rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-green-500 text-white outline-none font-medium text-sm transition-colors" 
                  required
                />
              </div>
            </div>
          </div>

          {/* Delivery Mode Selection */}
          <div>
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select Dispatch Channel</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['SMS', 'WhatsApp', 'Email', 'Telegram'].map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDirectDeliveryMode(mode)}
                  className={`py-2.5 px-4 rounded-xl border text-sm font-bold transition-all ${
                    directDeliveryMode === mode
                      ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-300'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isDirectSending}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
          >
            {isDirectSending ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Generating & Dispatching PDF...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Dispatch PDF Report Direct to Mobile
              </>
            )}
          </button>
        </form>

        {/* Dispatch response message */}
        <AnimatePresence>
          {directResponse && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="p-6 rounded-2xl border border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/10 space-y-6 text-sm"
            >
              <div className="flex items-center justify-between border-b border-green-200/40 dark:border-green-800/40 pb-3">
                <div className="font-extrabold text-green-900 dark:text-green-300 flex items-center gap-1.5 text-base">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  Advisory Report Generated Successfully!
                </div>
                {directResponse.pdf_url && (
                  <a 
                    href={directResponse.pdf_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-green-700 dark:text-green-400 hover:underline"
                  >
                    Download PDF Report
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                {/* QR Code Column */}
                {directPdfUrl && (
                  <div className="md:col-span-2 flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-2xl border border-green-100 dark:border-gray-700 shadow-sm text-center space-y-2.5">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(directPdfUrl)}`} 
                      alt="PDF QR Code" 
                      className="w-36 h-36 border border-gray-100 rounded-lg shadow-inner"
                    />
                    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      📷 Scan to Open PDF on Mobile
                    </div>
                  </div>
                )}

                {/* Direct App Launch Links Column */}
                <div className="md:col-span-3 space-y-4">
                  <div>
                    <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-1">Direct Client Dispatch (100% Works)</h4>
                    <p className="text-xs text-gray-500">Launch your mobile/native app to send or share the report instantly.</p>
                  </div>

                  {directClientLinks && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <a 
                        href={directClientLinks.whatsapp}
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold py-3 px-4 rounded-xl shadow-md transition-all active:scale-95 text-center"
                      >
                        Send via WhatsApp
                      </a>
                      <a 
                        href={directClientLinks.sms}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold py-3 px-4 rounded-xl shadow-md transition-all active:scale-95 text-center"
                      >
                        Send via SMS
                      </a>
                      <a 
                        href={directClientLinks.email}
                        className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-950 text-white text-xs font-extrabold py-3 px-4 rounded-xl shadow-md transition-all active:scale-95 text-center"
                      >
                        Send via Email App
                      </a>
                      <a 
                        href={directClientLinks.telegram}
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-extrabold py-3 px-4 rounded-xl shadow-md transition-all active:scale-95 text-center"
                      >
                        Share on Telegram
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

