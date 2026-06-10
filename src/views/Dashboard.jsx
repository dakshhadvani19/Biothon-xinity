import React from 'react';
import { ShieldCheck, Beaker, Thermometer, AlertTriangle, FileText } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Farmer Dashboard</h1>
          <p className="text-gray-400 mt-1">Live field diagnostics and crop telemetry streamed from mobile edge device</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1C2A1C] text-gray-300 hover:text-white hover:bg-[#111A11] transition-all font-semibold">
          <FileText className="w-4 h-4" />
          Generate Daily Report
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0D150D] border border-[#1C2A1C] rounded-2xl p-5 flex items-center gap-4 shadow-sm shadow-black/20">
          <div className="bg-[#111A11] p-3 rounded-xl border border-[#1C2A1C]">
            <ShieldCheck className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <div className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">Crops Index</div>
            <div className="text-2xl font-bold text-white">94% Healthy</div>
          </div>
        </div>

        <div className="bg-[#0D150D] border border-[#1C2A1C] rounded-2xl p-5 flex items-center gap-4 shadow-sm shadow-black/20">
          <div className="bg-[#111A11] p-3 rounded-xl border border-[#1C2A1C]">
            <Beaker className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">Soil Moisture</div>
            <div className="text-2xl font-bold text-white">60.8%</div>
          </div>
        </div>

        <div className="bg-[#111A11] border border-green-900/50 rounded-2xl p-5 flex items-center gap-4 shadow-[0_0_15px_rgba(34,197,94,0.05)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none"></div>
          <div className="bg-[#1A251A] p-3 rounded-xl border border-green-900/50">
            <Thermometer className="w-6 h-6 text-orange-400" />
          </div>
          <div className="relative z-10">
            <div className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">Soil Temp</div>
            <div className="text-2xl font-bold text-white">23.1°C</div>
          </div>
        </div>

        <div className="bg-[#0D150D] border border-[#1C2A1C] rounded-2xl p-5 flex items-center gap-4 shadow-sm shadow-black/20">
          <div className="bg-[#1A1515] p-3 rounded-xl border border-red-900/30">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <div className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">Threat Alerts</div>
            <div className="text-2xl font-bold text-red-500">4 Active</div>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Field Sectors Telemetry */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-white mb-2">Field Sectors Telemetry</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sector A */}
            <div className="bg-[#0D150D] border border-[#1C2A1C] rounded-2xl p-5 shadow-sm shadow-black/20">
              <h3 className="text-white font-bold mb-1">Sector A (North Tomatoes)</h3>
              <p className="text-sm font-semibold text-green-500 mb-6">Status: Healthy</p>
              
              <div className="flex justify-between text-center">
                <div>
                  <div className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">Moisture</div>
                  <div className="text-lg font-bold text-white">68.4%</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">Temp</div>
                  <div className="text-lg font-bold text-white">22.4°C</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">pH</div>
                  <div className="text-lg font-bold text-white">6.3</div>
                </div>
              </div>
            </div>

            {/* Sector B */}
            <div className="bg-[#0D150D] border border-[#1C2A1C] rounded-2xl p-5 shadow-sm shadow-black/20">
              <h3 className="text-white font-bold mb-1">Sector B (South Potatoes)</h3>
              <p className="text-sm font-semibold text-orange-400 mb-6">Status: Mild Early Blight Suspicion</p>
              
              <div className="flex justify-between text-center">
                <div>
                  <div className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">Moisture</div>
                  <div className="text-lg font-bold text-white">42.1%</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">Temp</div>
                  <div className="text-lg font-bold text-white">19°C</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">pH</div>
                  <div className="text-lg font-bold text-white">5.8</div>
                </div>
              </div>
            </div>

            {/* Sector C */}
            <div className="bg-[#0D150D] border border-[#1C2A1C] rounded-2xl p-5 shadow-sm shadow-black/20">
              <h3 className="text-white font-bold mb-1">Sector C (East Maize)</h3>
              <p className="text-sm font-semibold text-orange-400 mb-6">Status: Nitrogen Deficient</p>
              
              <div className="flex justify-between text-center">
                <div>
                  <div className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">Moisture</div>
                  <div className="text-lg font-bold text-white">59.8%</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">Temp</div>
                  <div className="text-lg font-bold text-white">24.7°C</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">pH</div>
                  <div className="text-lg font-bold text-white">6.6</div>
                </div>
              </div>
            </div>

            {/* Sector D */}
            <div className="bg-[#0D150D] border border-[#1C2A1C] rounded-2xl p-5 shadow-sm shadow-black/20">
              <h3 className="text-white font-bold mb-1">Sector D (West Peppers)</h3>
              <p className="text-sm font-semibold text-green-500 mb-6">Status: Healthy</p>
              
              <div className="flex justify-between text-center">
                <div>
                  <div className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">Moisture</div>
                  <div className="text-lg font-bold text-white">72.7%</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">Temp</div>
                  <div className="text-lg font-bold text-white">26.3°C</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1">pH</div>
                  <div className="text-lg font-bold text-white">6.2</div>
                </div>
              </div>
            </div>

          </div>

          {/* Sector A Telemetry Trends placeholder */}
          <div className="mt-8">
            <h2 className="text-lg font-bold text-white mb-4">Sector A Telemetry Trends</h2>
            <div className="bg-[#0D150D] border border-[#1C2A1C] rounded-2xl p-6 h-48 flex items-end justify-between items-center relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iMjAwIj48cGF0aCBkPSJNMCAxMDBRMTAwIDUwIDIwMCAxMDBUMzAwIDE1MFQ0MDAgMTAwVDUwMCA1MFQ2MDAgMTAwVDcwMCAxNTBUMDDAgMTAwIiBmaWxsPSJub25lIiBzdHJva2U9IiMyMkM1NUUiIHN0cm9rZS13aWR0aD0iNCIvPjwvc3ZnPg==')] bg-center bg-no-repeat bg-cover"></div>
                </div>
                <div className="text-gray-500 font-bold z-10 mx-auto">Graph Visualization Placeholder</div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Crop Threats */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <h2 className="text-lg font-bold text-white">Active Crop Threats</h2>
          </div>
          
          <div className="space-y-3">
            <div className="bg-[#1A1510] border border-orange-900/30 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Sector B (South Potatoes)</h4>
                <p className="text-sm text-gray-400 leading-snug">Low Soil Moisture (Optimal 50-70%)</p>
              </div>
            </div>

            <div className="bg-[#1A1510] border border-orange-900/30 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Sector B (South Potatoes)</h4>
                <p className="text-sm text-gray-400 leading-snug">Possible early-stage leaf lesions detected in camera 3</p>
              </div>
            </div>

            <div className="bg-[#1A1510] border border-orange-900/30 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Sector C (East Maize)</h4>
                <p className="text-sm text-gray-400 leading-snug">Low Nitrogen Level (Optimal: ~180 mg/kg)</p>
              </div>
            </div>

            <div className="bg-[#1A1510] border border-orange-900/30 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Sector C (East Maize)</h4>
                <p className="text-sm text-gray-400 leading-snug">Foliage showing light yellowing streaking</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-bold text-white mb-4">Daily Farm Suggestions</h2>
            <div className="bg-[#0D150D] border border-[#1C2A1C] rounded-2xl p-5 shadow-sm">
                <div className="space-y-4">
                    <div className="flex gap-3 items-start">
                        <div className="w-6 h-6 rounded-full bg-[#1A251A] border border-[#1C2A1C] flex items-center justify-center text-xs font-bold text-green-500 shrink-0">1</div>
                        <p className="text-sm text-gray-300">Increase irrigation in Sector B to address low soil moisture.</p>
                    </div>
                    <div className="flex gap-3 items-start">
                        <div className="w-6 h-6 rounded-full bg-[#1A251A] border border-[#1C2A1C] flex items-center justify-center text-xs font-bold text-green-500 shrink-0">2</div>
                        <p className="text-sm text-gray-300">Schedule nitrogen top-dressing for Sector C within 48 hours.</p>
                    </div>
                </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
