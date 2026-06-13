import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Settings, Volume2, ShieldCheck, HelpCircle } from 'lucide-react';

const VoiceAssistantModal = ({ isOpen, onClose }) => {
  const [agentId, setAgentId] = useState(() => {
    const stored = localStorage.getItem('elevenlabs_agent_id');
    if (stored === "b421a14c-1db2-4ffb-a25e-e47a9561de61") {
      return "agent_4001kv013qt6eh4a7ywnd2sv6yzd";
    }
    return stored || import.meta.env.VITE_ELEVENLABS_AGENT_ID || "agent_4001kv013qt6eh4a7ywnd2sv6yzd";
  });
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('elevenlabs_agent_id', agentId);
    setSaved(true);
    // Dispatch custom event to notify ElevenLabsAssistant component
    window.dispatchEvent(new Event('elevenlabs_agent_id_updated'));
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-[#0D150D]/90 border border-[#1C2A1C] rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden z-10 backdrop-blur-2xl"
          >
            {/* Glowing decoration */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-2.5 rounded-2xl shadow-[0_0_15px_rgba(34,197,94,0.2)] text-white">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">AI Voice Assistant</h2>
                  <p className="text-xs text-gray-400">Powered by ElevenLabs Conversational AI</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 rounded-xl border border-[#1C2A1C] hover:bg-[#111A11] text-gray-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6 relative z-10">
              
              {/* Feature Intro */}
              <div className="bg-[#111A11]/60 border border-[#1C2A1C] rounded-2xl p-4 space-y-3">
                <div className="flex gap-2 text-green-400 font-semibold text-sm">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  Intelligent Agronomist Agent
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Start a real-time, interactive voice conversation with AgriShield's virtual assistant. Ask about field telemetry, soil health, crop suitability, or request weather recommendations.
                </p>
              </div>

              {/* ElevenLabs Configuration Settings */}
              <form onSubmit={handleSave} className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5" />
                    Agent Connection ID
                  </label>
                  <span className="text-[10px] text-green-500 font-semibold">Active Session</span>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    placeholder="Enter ElevenLabs Agent ID"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#080D08] border border-[#1C2A1C] text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-green-500/50 transition-all font-mono"
                  />
                  <button 
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-black font-semibold text-sm shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                  >
                    {saved ? 'Saved!' : 'Save'}
                  </button>
                </div>
              </form>

              {/* How to add a girl voice info card */}
              <div className="border border-green-900/30 bg-green-950/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider">
                  <Volume2 className="w-4 h-4" />
                  Voice & Language Configuration
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-semibold">
                  To set a premium female voice (Rachel, Nicole, Gigi) and enable Hindi/Telugu support:
                </p>
                <ol className="list-decimal list-inside text-[11px] text-gray-400 space-y-1 pl-1">
                  <li>Go to your <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">ElevenLabs Dashboard</a>.</li>
                  <li>In the <b>Conversational AI Agent</b> page, go to the <b>Agent Voice</b> settings and select a female voice.</li>
                  <li>Set the Agent's language model to <b>Eleven Multilingual v2</b> under settings (for fluent Hindi & Telugu pronunciation).</li>
                  <li>Copy your <b>Agent ID</b> and paste it into the field above.</li>
                </ol>

                <div className="pt-2 border-t border-green-900/20 flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Supported:</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-green-900/40 text-green-400 border border-green-500/20">English</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-green-900/40 text-green-400 border border-green-500/20">Hindi (हिन्दी)</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-green-900/40 text-green-400 border border-green-500/20">Telugu (తెలుగు)</span>
                </div>
              </div>

              {/* Floating widget notice */}
              <div className="flex items-center gap-2 text-[10px] text-gray-500 justify-center">
                <HelpCircle className="w-3.5 h-3.5" />
                Once saved, look for the green glowing microphone bubble in the bottom right corner of the page.
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VoiceAssistantModal;
