import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutGrid, 
  FileText, 
  Cloud, 
  PlusCircle, 
  Video, 
  BookOpen, 
  MessageSquare,
  Users,
  User,
  Book,
  Leaf
} from 'lucide-react';

const Sidebar = () => {
  const mainLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutGrid },
    { name: 'Disease Detection', path: '/diagnostic', icon: FileText },
    { name: 'Weather Advisory', path: '/weather', icon: Cloud },
    { name: 'Try New Crop', path: '/try-new', icon: PlusCircle },
    { name: 'Field Simulator', path: '/simulator', icon: Video },
    { name: 'Nutrition Base', path: '/nutrient-analysis', icon: BookOpen },
    { name: 'Farming Chat', path: '/chat', icon: MessageSquare },
  ];

  const moreLinks = [
    { name: 'Community Feed', path: '/feed', icon: Users },
    { name: 'App Guide', path: '/guide', icon: Book },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <aside className="w-[260px] h-screen bg-[#0A0F0A] border-r border-[#1C2A1C] flex flex-col shrink-0 sticky top-0 overflow-y-auto custom-scrollbar">
      {/* Logo Area */}
      <div className="p-6 pb-8 flex items-center gap-3">
        <div className="bg-green-500 p-2 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.3)]">
          <Leaf className="w-6 h-6 text-black" />
        </div>
        <div>
          <h1 className="text-white font-black text-lg tracking-wide leading-tight">AGRISHIELD AI</h1>
          <p className="text-green-500 text-[10px] font-bold tracking-widest uppercase">Smart Platform</p>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 space-y-1.5">
        {mainLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm ${
                isActive 
                  ? 'text-green-400 bg-[#111A11] border border-[#1C2A1C]' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#111A11]/50 border border-transparent'
              }`
            }
          >
            <link.icon className="w-5 h-5 shrink-0" strokeWidth={2.5} />
            {link.name}
          </NavLink>
        ))}

        {/* Divider */}
        <div className="h-px bg-[#1C2A1C] my-6 mx-2"></div>
        <div className="px-4 pb-2 text-xs font-bold text-gray-600 uppercase tracking-wider">More</div>

        {/* More Navigation */}
        {moreLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm ${
                isActive 
                  ? 'text-green-400 bg-[#111A11] border border-[#1C2A1C]' 
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#111A11]/50 border border-transparent'
              }`
            }
          >
            <link.icon className="w-5 h-5 shrink-0" strokeWidth={2.5} />
            {link.name}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Area (e.g. system status or version) */}
      <div className="p-6 mt-auto">
        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
          Mobile Server Stream Active
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
