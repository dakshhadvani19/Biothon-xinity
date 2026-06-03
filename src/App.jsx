import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';
import Dashboard from './views/Dashboard';
import Diagnostic from './views/Diagnostic';
import CommunityFeed from './views/CommunityFeed';

const NavLinks = () => {
  const location = useLocation();
  
  const links = [
    { name: 'Dashboard', path: '/' },
    { name: 'Diagnostic', path: '/diagnostic' },
    { name: 'Feed', path: '/feed' },
  ];

  return (
    <nav className="flex items-center gap-1 bg-gray-100/80 p-1.5 rounded-full border border-gray-200/80 shadow-inner">
      {links.map((link) => {
        const isActive = location.pathname === link.path;
        return (
          <Link
            key={link.name}
            to={link.path}
            className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
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
            <span className="relative z-10">{link.name}</span>
          </Link>
        );
      })}
    </nav>
  );
};

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-gray-200/50 shadow-sm transition-all">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            {/* Logo Section */}
            <Link to="/" className="flex items-center gap-2.5 group w-[180px]">
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
            <div className="w-[180px] flex justify-end">
               <button className="w-9 h-9 rounded-full bg-green-50 hover:bg-green-100 border border-green-200 overflow-hidden flex items-center justify-center transition-colors hover:scale-105 active:scale-95">
                 <span className="text-xs font-bold text-green-700">DH</span>
               </button>
            </div>
          </div>
        </header>

        <main className="container mx-auto p-4 md:p-6 flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/diagnostic" element={<Diagnostic />} />
            <Route path="/feed" element={<CommunityFeed />} />
          </Routes>
        </main>
        
        <footer className="bg-white border-t border-gray-200/50 p-6 text-center text-sm font-medium text-gray-400">
          &copy; {new Date().getFullYear()} AgriShield Ecosystem
        </footer>
      </div>
    </Router>
  );
};

export default App;
