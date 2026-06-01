import React from 'react';
import { Activity } from 'lucide-react';

const CommunityFeed = () => {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Activity className="w-6 h-6 text-blue-600" />
        Community Feed
      </h1>
      <p className="text-gray-600">Hyperlocal outbreak warning ticker.</p>
    </div>
  );
};

export default CommunityFeed;
