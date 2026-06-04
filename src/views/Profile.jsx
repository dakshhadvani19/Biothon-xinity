import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Sprout, Mountain, Trash2, Plus, X } from 'lucide-react';

const Profile = () => {
  const [farms, setFarms] = useState([]);
  const [newCrop, setNewCrop] = useState('');
  const [newSoil, setNewSoil] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAddingFarm, setIsAddingFarm] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedFarms = localStorage.getItem('agrishield_user_farms');
    if (savedFarms) {
      try {
        setFarms(JSON.parse(savedFarms));
      } catch (e) {
        console.error("Failed to parse farms from local storage", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever farms change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('agrishield_user_farms', JSON.stringify(farms));
    }
  }, [farms, isLoaded]);

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
    setIsAddingFarm(false); // Close the form after adding
  };

  const handleDeleteFarm = (id) => {
    setFarms(prev => prev.filter(farm => farm.id !== id));
  };

  return (
    <div className="relative min-h-[calc(100vh-140px)] w-full flex flex-col items-center py-10 px-4 bg-gray-50">
      
      {/* Main Solid Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl bg-white border-2 border-gray-200 shadow-xl rounded-2xl p-6 md:p-10"
      >
        {/* Header */}
        <div className="flex items-center gap-5 mb-10 pb-6 border-b-2 border-gray-100">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 border-2 border-green-500 shadow-sm">
            <User className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Agronomic Profile
            </h1>
            <p className="text-gray-600 font-medium mt-1">
              Manage your agricultural assets and crop data.
            </p>
          </div>
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
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-green-500 text-green-700 font-bold rounded-xl hover:bg-green-50 transition-colors shadow-sm"
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
