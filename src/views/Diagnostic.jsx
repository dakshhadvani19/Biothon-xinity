import React from 'react';
import { Camera } from 'lucide-react';
import DiagnosticCapture from '../components/DiagnosticCapture';
const Diagnostic = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 mt-12 md:mt-20 pb-16 px-4 sm:px-0">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white flex items-center gap-4 tracking-tight drop-shadow-sm">
            <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-3 rounded-2xl shadow-[0_0_20px_rgba(52,211,153,0.3)] text-white">
              <Camera className="w-7 h-7" />
            </div>
            Field Diagnostics
          </h1>
          <p className="text-emerald-100/70 mt-3 text-lg font-medium max-w-2xl">Scan crops for instant pathogen detection and health analysis.</p>
        </div>
      </header>

      <section className="bg-emerald-950/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-500/20 p-8 md:p-10 relative overflow-hidden space-y-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10">
          <DiagnosticCapture />
        </div>
      </section>
    </div>
  );
};

export default Diagnostic;
