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
import ComingSoon from './views/ComingSoon';
import { AuthProvider } from './context/AuthContext';
import Sidebar from './components/layout/Sidebar';

import useLiveWeather from './hooks/useLiveWeather';
import { Agentation } from "agentation";
import { SpeechProvider } from './context/SpeechContext';
import SpeechPlayer from './components/SpeechPlayer';


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
      <SpeechProvider>
      <AuthProvider>
      <div className="flex h-screen bg-[#0A0F0A] overflow-hidden font-sans text-gray-100">
        <Sidebar />

        <main className="flex-1 flex flex-col relative overflow-y-auto custom-scrollbar">
            <PostAuthRedirect />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/diagnostic" element={<Diagnostic />} />
              <Route path="/try-new" element={<TryNewCrop />} />
              <Route path="/simulator" element={<ComingSoon />} />
              <Route path="/weather" element={<UpdatesDashboard />} />
              <Route path="/nutrient-analysis" element={<NutrientAnalysis />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/feed" element={<CommunityFeed />} />
              <Route path="/updates" element={<UpdatesDashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/guide" element={<Guide />} />
            </Routes>
        
            <SpeechPlayer />

            {window.location.origin === 'http://localhost:5174' && (
              <Agentation endpoint="http://localhost:4747" onSessionCreated={(sessionId) => console.log("Agentation Session:", sessionId)} />
            )}
        </main>
      </div>
      </AuthProvider>
      </SpeechProvider>
    </Router>
  );
};

export default App;
