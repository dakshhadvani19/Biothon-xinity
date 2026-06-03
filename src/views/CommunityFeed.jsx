import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, AlertTriangle, Activity, ShieldCheck, Clock } from 'lucide-react';
import { databases, APPWRITE_CONFIG } from '../api/appwrite';
import { Query } from 'appwrite';

const CommunityFeed = () => {
  const [feedData, setFeedData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchFeed = async () => {
      try {
        setIsLoading(true);
        // Using Query.orderDesc to get the latest threats first, and limiting to 25 to optimize payload size
        const response = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.feedCollectionId,
          [
            Query.orderDesc('$createdAt'),
            Query.limit(25)
          ]
        );
        
        if (isMounted) {
          setFeedData(response.documents);
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching community feed:", err);
        if (isMounted) {
          setError("Failed to connect to the regional radar. Please try again.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchFeed();

    return () => {
      isMounted = false; // Cleanup to prevent state updates on unmounted component
    };
  }, []);

  // Helper to format ISO timestamp into relative time
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `Reported ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `Reported ${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `Reported ${days} day${days > 1 ? 's' : ''} ago`;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Dark Themed Threat Radar Header */}
      <div className="bg-slate-900 rounded-t-3xl p-8 border-b border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Radar sweeping background effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse" />
        
        <header className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <Activity className="w-8 h-8 text-red-500 animate-pulse" />
              Regional Threat Radar
            </h1>
            <p className="text-slate-400 mt-2 text-lg">Live monitoring of high-priority crop pathogens.</p>
          </div>
          
          <div className="bg-slate-800/80 backdrop-blur border border-slate-700 px-4 py-2 rounded-full inline-flex items-center gap-2 self-start md:self-auto shadow-inner">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-sm font-bold text-slate-200 tracking-wide">LIVE UPDATES</span>
          </div>
        </header>
      </div>

      {/* Feed Container */}
      <div className="bg-slate-950 rounded-b-3xl p-6 md:p-8 min-h-[400px] shadow-2xl border border-t-0 border-slate-800">
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-red-400 font-bold text-lg mb-1">{error}</h3>
            <p className="text-red-300/80 text-sm">Please check your connection and try again.</p>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && !error && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row gap-5 animate-pulse">
                <div className="w-16 h-16 bg-slate-800 rounded-xl shrink-0" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-5 bg-slate-800 rounded-md w-1/3" />
                  <div className="h-4 bg-slate-800 rounded-md w-1/4" />
                </div>
                <div className="h-8 bg-slate-800 rounded-full w-24 self-start mt-2 sm:mt-0" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State / All Clear */}
        {!isLoading && !error && feedData.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 px-4 text-center"
          >
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-green-500/20">
              <ShieldCheck className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-green-400 mb-2">All Clear</h2>
            <p className="text-slate-400 max-w-sm">No regional threats or pathogen outbreaks have been detected in your monitored sector.</p>
          </motion.div>
        )}

        {/* Data List */}
        {!isLoading && !error && feedData.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            <AnimatePresence>
              {feedData.map((alert) => (
                <motion.div
                  key={alert.$id}
                  variants={itemVariants}
                  className="bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 md:p-6 transition-all group shadow-sm flex flex-col sm:flex-row gap-5 items-start sm:items-center relative overflow-hidden"
                >
                  {/* Subtle red indicator stripe */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-red-600 opacity-80" />

                  <div className="bg-red-500/10 p-4 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 truncate mb-1.5">
                      {alert.disease_name || 'Unknown Pathogen'}
                    </h3>
                    
                    <div className="flex items-center gap-3 text-slate-400 text-sm">
                      <span className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-md text-slate-300 border border-slate-700/50">
                        <MapPin className="w-3.5 h-3.5" />
                        {alert.region_tag || 'Unspecified Region'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-500 text-sm font-medium whitespace-nowrap bg-slate-950/50 px-3 py-1.5 rounded-full border border-slate-800/80">
                    <Clock className="w-4 h-4" />
                    {timeAgo(alert.$createdAt)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CommunityFeed;
