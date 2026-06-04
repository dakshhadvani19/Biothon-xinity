import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Sprout, Mountain, Trash2, Plus, X, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Pseudo-database functions (using localStorage for now)
const getUserFarms = (userId) => {
  const savedFarms = localStorage.getItem(`agrishield_farms_${userId}`);
  return savedFarms ? JSON.parse(savedFarms) : [];
};

const addFarmToDB = (userId, farmsArray) => {
  localStorage.setItem(`agrishield_farms_${userId}`, JSON.stringify(farmsArray));
};

const Profile = () => {
  const { user, isLoading, loginWithGoogle, logout } = useAuth();
  
  const [farms, setFarms] = useState([]);
  const [newCrop, setNewCrop] = useState('');
  const [newSoil, setNewSoil] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAddingFarm, setIsAddingFarm] = useState(false);

  // Load farms when user is available
  useEffect(() => {
    if (user && user.$id) {
      try {
        setFarms(getUserFarms(user.$id));
      } catch (e) {
        console.error("Failed to parse farms", e);
      }
      setIsLoaded(true);
    }
  }, [user]);

  // Save to DB whenever farms change
  useEffect(() => {
    if (isLoaded && user && user.$id) {
      addFarmToDB(user.$id, farms);
    }
  }, [farms, isLoaded, user]);

  const handleAddFarm = (e) => {
    e.preventDefault();
    if (!newCrop.trim() || !newSoil.trim()) return;
    
    const newFarm = {
      id: Date.now(),
      crop: newCrop.trim(),
      soil: newSoil.trim()
    };
    
    setFarms(prev => [...prev, newFarm]);
    setNewCrop('');
    setNewSoil('');
    setIsAddingFarm(false);
  };

  const handleDeleteFarm = (id) => {
    setFarms(prev => prev.filter(farm => farm.id !== id));
  };

  // State 1: Global Loading (The Skeleton)
  if (isLoading) {
    return (
      <div className="relative min-h-[calc(100vh-140px)] w-full flex flex-col items-center py-10 px-4 bg-gray-50">
        <div className="w-full max-w-3xl bg-white/70 backdrop-blur-xl border-2 border-white/50 shadow-xl rounded-2xl p-6 md:p-10 animate-pulse">
          <div className="flex items-center gap-5 mb-10 pb-6 border-b border-gray-200">
            <div className="w-16 h-16 rounded-full bg-gray-200"></div>
            <div className="space-y-3">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
              <div className="h-4 bg-gray-200 rounded w-64"></div>
            </div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            <div className="h-24 bg-gray-200 rounded-xl w-full"></div>
            <div className="h-24 bg-gray-200 rounded-xl w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // State 2: The Unauthenticated Portal (Login Screen)
  if (!user) {
    return (
      <div className="relative min-h-[calc(100vh-140px)] w-full flex flex-col items-center justify-center py-10 px-4 bg-gray-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white shadow-2xl rounded-3xl p-8 text-center"
        >
          <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-green-100">
            <User className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            Access Your Agronomic Profile
          </h1>
          <p className="text-gray-500 font-medium mb-8 px-4">
            Sign in to manage your connected farms, analyze soil data, and get AI insights.
          </p>
          
          <motion.button
            onClick={loginWithGoogle}
            whileHover={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
            whileTap={{ scale: 0.95 }}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-800 font-bold hover:bg-gray-50 transition-colors"
          >
            {/* Generic User/G-logo placeholder since SVG isn't explicitly provided */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // State 3: The Authenticated Dashboard (Farm Manager)
  return (
    <div className="relative min-h-[calc(100vh-140px)] w-full flex flex-col items-center py-10 px-4 bg-gray-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl bg-white border-2 border-gray-200 shadow-xl rounded-2xl p-6 md:p-10"
      >
        {/* Header Upgrade */}
        <div className="flex items-start sm:items-center justify-between gap-5 mb-10 pb-6 border-b-2 border-gray-100 flex-col sm:flex-row">
          <div className="flex items-center gap-5">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 border-2 border-green-500 shadow-sm overflow-hidden">
              <span className="text-xl font-bold text-green-700">
                {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-8 h-8 text-green-600" />}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user.name || 'Agronomic Profile'}
              </h1>
              <p className="text-gray-600 font-medium mt-1">
                {user.email || 'Manage your agricultural assets and crop data.'}
              </p>
            </div>
          </div>
          
          <motion.button
            onClick={logout}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 border-2 border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm whitespace-nowrap self-end sm:self-auto"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </motion.button>
        </div>

        {/* The Farm Registry */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Your Registered Farms
              <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-bold border border-green-200">
                {farms.length}
              </span>
            </h2>
            
            {!isAddingFarm && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsAddingFarm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-green-500 text-green-700 font-bold rounded-xl hover:bg-green-50 transition-colors shadow-sm whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                Add New Farm
              </motion.button>
            )}
          </div>

          <div className="space-y-4 min-h-[120px]">
            <AnimatePresence mode="popLayout">
              {farms.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300"
                >
                  <Sprout className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-gray-600 font-medium text-center">
                    No farms registered.<br />Click 'Add New Farm' to start.
                  </p>
                </motion.div>
              ) : (
                farms.map((farm) => (
                  <motion.div
                    key={farm.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-green-300 hover:shadow-md transition-all"
                  >
                    <div className="flex flex-wrap items-center gap-6 mb-4 sm:mb-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-green-50 rounded-xl border border-green-100">
                          <Sprout className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Crop Type</p>
                          <p className="text-lg font-bold text-gray-900">{farm.crop}</p>
                        </div>
                      </div>
                      <div className="hidden sm:block w-0.5 h-12 bg-gray-200"></div>
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                          <Mountain className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Soil Type</p>
                          <p className="text-lg font-bold text-gray-900">{farm.soil}</p>
                        </div>
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteFarm(farm.id)}
                      className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors self-end sm:self-auto border border-transparent hover:border-red-200"
                      title="Delete Farm"
                    >
                      <Trash2 className="w-6 h-6" />
                    </motion.button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* The Input Module (Conditionally Rendered) */}
        <AnimatePresence>
          {isAddingFarm && (
            <motion.div 
              initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
              animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              className="bg-white rounded-2xl p-6 md:p-8 border-2 border-green-200 shadow-sm"
            >
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold text-gray-900">
                  Register New Farm
                </h3>
                <button 
                  onClick={() => setIsAddingFarm(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleAddFarm} className="flex flex-col md:flex-row gap-5 items-start md:items-end">
                <div className="w-full">
                  <label htmlFor="crop" className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                    Crop Type
                  </label>
                  <input
                    id="crop"
                    type="text"
                    placeholder="e.g. Wheat, Soybeans"
                    value={newCrop}
                    onChange={(e) => setNewCrop(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-green-500 rounded-xl text-black placeholder-gray-400 font-medium focus:outline-none focus:ring-4 focus:ring-green-500/20 transition-all"
                  />
                </div>
                
                <div className="w-full">
                  <label htmlFor="soil" className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                    Soil Type
                  </label>
                  <input
                    id="soil"
                    type="text"
                    placeholder="e.g. Loamy, Clay"
                    value={newSoil}
                    onChange={(e) => setNewSoil(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-green-500 rounded-xl text-black placeholder-gray-400 font-medium focus:outline-none focus:ring-4 focus:ring-green-500/20 transition-all"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={!newCrop.trim() || !newSoil.trim()}
                  whileHover={{ scale: 1.05, y: -2, boxShadow: "0px 10px 20px rgba(34, 197, 94, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full md:w-auto mt-2 md:mt-0 px-8 py-3.5 bg-gradient-to-br from-green-500 to-green-600 text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                >
                  Add Farm
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Profile;
