import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { motion } from 'framer-motion';
import { Leaf, AlertTriangle, User } from 'lucide-react';
import Dashboard from './views/Dashboard';
import Diagnostic from './views/Diagnostic';
import TryNewCrop from './views/TryNewCrop';
import CommunityFeed from './views/CommunityFeed';
import UpdatesDashboard from './views/UpdatesDashboard';
import Chat from './views/Chat';
import NutrientAnalysis from './views/NutrientAnalysis';
import Profile from './views/Profile';
import Guide from './views/Guide';
import { AuthProvider } from './context/AuthContext';

import useLiveWeather from './hooks/useLiveWeather';

const NavLinks = () => {
  const location = useLocation();
  const { data } = useLiveWeather();
  const hasAlerts = data && data.alerts && data.alerts.length > 0;
  
  const links = [
    { name: 'Dashboard', path: '/' },
    { name: 'Diagnostic', path: '/diagnostic' },
    { name: 'Try New Name', path: '/try-new' },
    { name: 'Nutrient Analysis', path: '/nutrient-analysis' },
    { name: 'Feed', path: '/feed' },
    { name: 'Live Updates', path: '/updates' },
    { name: 'Chat', path: '/chat' },
    { name: 'Guide', path: '/guide' },
  ];

  return (
    <nav className="flex items-center gap-1 bg-gray-100/80 p-1.5 rounded-full border border-gray-200/80 shadow-inner overflow-x-auto">
      {links.map((link) => {
        const isActive = location.pathname === link.path;
        return (
          <Link
            key={link.name}
            to={link.path}
            className={`relative px-4 md:px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center whitespace-nowrap ${
              isActive 
                ? 'text-white' 
                : 'text-gray-500 hover:text-green-700 hover:bg-green-50/80'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-[0_4px_12px_rgba(34,197,94,0.4)] z-0 border border-green-400"
                transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {link.name}
              {link.name === 'Live Updates' && hasAlerts && (
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600 shadow-sm border border-red-800"></span>
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

// Handles redirect back to the page the user was on before Google OAuth
const PostAuthRedirect = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !user) return;
    const savedPath = sessionStorage.getItem('agrishield_pre_auth_path');
    if (savedPath && savedPath !== window.location.pathname) {
      sessionStorage.removeItem('agrishield_pre_auth_path');
      navigate(savedPath, { replace: true });
    }
  }, [user, isLoading, navigate]);

  return null;
};

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-gray-200/50 shadow-sm transition-all overflow-x-hidden">
          <div className="container mx-auto px-4 h-auto min-h-[64px] py-2 flex flex-wrap items-center justify-between gap-y-4">
            {/* Logo Section */}
            <Link to="/" className="flex items-center gap-2.5 group w-auto md:w-[180px]">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-1.5 rounded-xl shadow-sm group-hover:shadow-md transition-all group-hover:scale-105 group-active:scale-95">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-gray-900">
                AgriShield
              </span>
            </Link>

            {/* Animated Navigation */}
            <NavLinks />

            {/* Right side placeholder (Avatar) to balance layout */}
            <div className="hidden md:flex w-[180px] justify-end">
               <Link to="/profile" className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-full p-2">
                 <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
               </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto p-4 md:p-6 flex-1 flex flex-col">

          <AuthProvider>
            <PostAuthRedirect />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/diagnostic" element={<Diagnostic />} />
              <Route path="/try-new" element={<TryNewCrop />} />
              <Route path="/nutrient-analysis" element={<NutrientAnalysis />} />
              <Route path="/feed" element={<CommunityFeed />} />
              <Route path="/updates" element={<UpdatesDashboard />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/guide" element={<Guide />} />
            </Routes>
          </AuthProvider>
        </main>
        
        <footer className="bg-white border-t border-gray-200/50 p-6 text-center text-sm font-medium text-gray-400 mt-auto">
          &copy; {new Date().getFullYear()} AgriShield Ecosystem
        </footer>
      </div>
    </Router>
  );
};

export default App;
