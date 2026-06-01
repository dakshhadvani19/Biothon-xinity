import React from 'react';
import { ShieldAlert } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <ShieldAlert className="w-6 h-6 text-blue-600" />
        Dashboard
      </h1>
      <p className="text-gray-600">Overview hub with regional threat levels.</p>
    </div>
  );
};

export default Dashboard;
