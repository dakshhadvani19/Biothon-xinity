import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { calculateGrowthScore } from '../utils/cropScoring';

const TelemetryChart = ({ cropName, fullHourlyData }) => {
  const chartData = useMemo(() => {
    if (!fullHourlyData || fullHourlyData.length === 0) return [];
    
    const currentEpoch = Math.floor(Date.now() / 1000);
    let currentIndex = fullHourlyData.findIndex(h => h.time_epoch >= currentEpoch);
    if (currentIndex === -1) currentIndex = fullHourlyData.length - 1;

    // Grab up to 12 hours ending at currentIndex
    const startIndex = Math.max(0, currentIndex - 11);
    const past12Hours = fullHourlyData.slice(startIndex, currentIndex + 1);
    
    return past12Hours.map(hour => {
      const timeStr = hour.timestamp.split(' ')[1];
      return {
        time: timeStr,
        score: calculateGrowthScore(cropName, hour.temp),
        temp: hour.temp
      };
    });
  }, [cropName, fullHourlyData]);

  if (chartData.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-gray-500 border border-[#1C2A1C] rounded-2xl bg-[#0D150D]">
        No telemetry data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111A11] border border-[#1C2A1C] p-3 rounded-xl shadow-xl">
          <p className="text-white font-bold mb-1">{label}</p>
          <p className="text-blue-400 text-sm font-semibold">Growth Score: {payload[0].value.toFixed(1)}/10</p>
          <p className="text-gray-400 text-xs mt-1">Temp: {payload[0].payload.temp}°C</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64 p-4 bg-[#0D150D] border border-[#1C2A1C] rounded-2xl shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-blue-500" />
        <h3 className="text-sm font-bold text-white tracking-wide">{cropName} Telemetry</h3>
      </div>
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`colorScore_${cropName}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={`colorScoreStroke_${cropName}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1C2A1C" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#4b5563" 
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickMargin={10}
              axisLine={false}
              tickLine={false}
              interval={1} 
            />
            <YAxis 
              domain={[0, 10]} 
              ticks={[0, 2, 4, 6, 8, 10]} 
              stroke="#4b5563" 
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#1C2A1C', strokeWidth: 2, strokeDasharray: '4 4' }} />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke={`url(#colorScoreStroke_${cropName})`} 
              strokeWidth={3}
              fillOpacity={1} 
              fill={`url(#colorScore_${cropName})`} 
              isAnimationActive={true}
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TelemetryChart;
