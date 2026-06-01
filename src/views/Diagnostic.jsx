import React from 'react';
import { Camera } from 'lucide-react';
import DiagnosticCapture from '../components/DiagnosticCapture';

const Diagnostic = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
          <Camera className="w-8 h-8 text-green-600" />
          Field Diagnostics
        </h1>
        <p className="text-gray-600 mt-2 text-lg">Scan crops for instant pathogen detection and health analysis.</p>
      </header>

      <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10">
        <DiagnosticCapture />
      </section>
    </div>
  );
};

export default Diagnostic;
