import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { farmService } from '../services/farmService';
import { Sprout, Mountain, Trash2, Plus, LogOut, User } from 'lucide-react';

export default function Profile() {
    const { user, isLoading, loginWithGoogle, logout } = useAuth();
    const [farms, setFarms] = useState([]);
    const [newCrop, setNewCrop] = useState('');
    const [newSoil, setNewSoil] = useState('');
    const [isFetchingFarms, setIsFetchingFarms] = useState(false);

    useEffect(() => {
        if (user) {
            setIsFetchingFarms(true);
            farmService.getUserFarms(user.$id)
                .then(setFarms)
                .finally(() => setIsFetchingFarms(false));
        }
    }, [user]);

    const handleAddFarm = async () => {
        if (!newCrop || !newSoil || !user) return;
        try {
            const doc = await farmService.addFarmToDB(user.$id, newCrop, newSoil);
            setFarms([...farms, doc]);
            setNewCrop('');
            setNewSoil('');
        } catch (error) {
            alert("Failed to add farm.");
        }
    };

    const handleDelete = async (farmId) => {
        try {
            await farmService.deleteFarmFromDB(farmId);
            setFarms(farms.filter(f => f.$id !== farmId));
        } catch (error) {
            alert("Failed to delete farm.");
        }
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center animate-pulse text-gray-500">Loading Secure Profile...</div>;
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100 dark:border-gray-700">
                    <User className="mx-auto h-16 w-16 text-green-500 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Agronomic Profile</h2>
                    <button onClick={loginWithGoogle} className="w-full flex items-center justify-center space-x-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all font-medium">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span>Sign in with Google</span>
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-3xl mx-auto space-y-6">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
                        <p className="text-gray-500">{user.email}</p>
                    </div>
                    <button onClick={logout} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                        <LogOut size={20} />
                    </button>
                </motion.div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-4 dark:text-white">Your Registered Farms</h2>
                    
                    {isFetchingFarms ? <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div> : null}

                    <div className="space-y-3 mb-6">
                        <AnimatePresence>
                            {farms.map((farm) => (
                                <motion.div key={farm.$id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                                    <div className="flex space-x-6">
                                        <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                                            <Sprout size={18} className="text-emerald-500"/> <span>{farm.crop}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200">
                                            <Mountain size={18} className="text-amber-500"/> <span>{farm.soil}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(farm.$id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {farms.length === 0 && !isFetchingFarms && <p className="text-gray-500 text-center py-4">No farms registered yet.</p>}
                    </div>

                    <div className="flex space-x-3">
                        <input value={newCrop} onChange={(e) => setNewCrop(e.target.value)} placeholder="Crop (e.g. Cotton)" className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 dark:text-white outline-none" />
                        <input value={newSoil} onChange={(e) => setNewSoil(e.target.value)} placeholder="Soil (e.g. Black)" className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 dark:text-white outline-none" />
                        <button onClick={handleAddFarm} className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-1 transition-all"><Plus size={18} /><span>Add</span></button>
                    </div>
                </div>
            </div>
        </div>
    );
}
