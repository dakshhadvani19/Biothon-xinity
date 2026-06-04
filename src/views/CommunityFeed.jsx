import React from 'react';
import { Activity, Clock } from 'lucide-react';

const CommunityFeed = () => {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Dark Themed Threat Radar Header */}
      <div className="bg-slate-900 rounded-t-3xl p-8 border-b border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Radar sweeping background effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
        
        <header className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-400" />
              Regional Threat Radar
            </h1>
            <p className="text-slate-400 mt-2 text-lg">Live monitoring of high-priority crop pathogens.</p>
          </div>
          
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700 px-4 py-2 rounded-full inline-flex items-center gap-2 self-start md:self-auto shadow-inner">
            <span className="text-sm font-bold text-slate-300 tracking-wide">SYSTEM UPGRADE</span>
          </div>
        </header>
      </div>

      {/* Coming Soon Container */}
      <div className="bg-slate-950 rounded-b-3xl p-6 md:p-12 min-h-[400px] shadow-2xl border border-t-0 border-slate-800 flex flex-col items-center justify-center text-center">
        
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-10 max-w-lg w-full relative overflow-hidden">
          {/* Subtle grid background or glowing effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10">
            <div className="w-20 h-20 bg-blue-900/50 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
              <Clock className="w-10 h-10 text-blue-400 animate-pulse" />
            </div>
            
            <h3 className="text-blue-400 font-extrabold text-2xl mb-3 tracking-tight">
              Feature Coming Soon
            </h3>
            
            <p className="text-blue-200/70 text-base leading-relaxed">
              We are currently deploying next-generation infrastructure for the Regional Threat Radar. Live pathogen monitoring and community alerts will be available in the upcoming release.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CommunityFeed;
