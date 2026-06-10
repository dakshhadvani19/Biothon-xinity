import React from 'react';
import { Hammer } from 'lucide-react';

export default function ComingSoon() {
  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center p-8">
      <div className="w-24 h-24 bg-[#111A11] border border-[#1C2A1C] rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-black/50">
        <Hammer className="w-12 h-12 text-green-500" />
      </div>
      <h1 className="text-3xl font-black text-white mb-3">Feature Coming Soon</h1>
      <p className="text-gray-400 text-lg max-w-md text-center">
        We are actively working on this module. Check back later for updates to the AgriShield platform!
      </p>
    </div>
  );
}
