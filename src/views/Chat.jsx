import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Sparkles, Trash2, Sprout, ArrowRight, Leaf, Thermometer, Wind, CloudRain, Volume2, Plus, Search, Clock, MessageCircle, AlertTriangle, X, Mic, MicOff, Settings } from 'lucide-react';
import { aiService } from '../services/aiService';
import { farmService } from '../services/farmService';
import { chatService, serializeMessages, deserializeMessages, formatChatDate } from '../services/chatService';
import { groupChatsByDate } from '../utils/dateFormatter';
import { useAuth } from '../context/AuthContext';
import useLiveWeather from '../hooks/useLiveWeather';
import { useSpeech } from '../context/SpeechContext';

// Renders markdown-like formatting: **bold**, bullet points, numbered lists
function FormattedMessage({ content }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const isBullet = /^[-•*]\s+/.test(line);
        const isNumbered = /^\d+\.\s+/.test(line);
        const cleanLine = line.replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '');

        const renderBold = (text) => {
          const parts = text.split(/\*\*(.*?)\*\*/g);
          return parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j} className="font-bold">{part}</strong> : part
          );
        };

        if (!line.trim()) return <div key={i} className="h-1" />;

        if (isBullet || isNumbered) {
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
              <span>{renderBold(cleanLine)}</span>
            </div>
          );
        }

        if (line.trim().endsWith(':') && line.trim().length < 50) {
          return (
            <p key={i} className="font-bold text-gray-700 mt-2">
              {renderBold(line)}
            </p>
          );
        }

        return <p key={i}>{renderBold(line)}</p>;
      })}
    </div>
  );
}

// Highlights the matched portion of a chat title during search
function HighlightedTitle({ title, query }) {
  if (!query.trim()) return <span>{title}</span>;
  const idx = title.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{title}</span>;
  return (
    <>
      {title.slice(0, idx)}
      <span className="text-green-400 font-bold">{title.slice(idx, idx + query.length)}</span>
      {title.slice(idx + query.length)}
    </>
  );
}

const WELCOME_MSG = (text) => ({ role: 'assistant', content: text, content_hi: '', content_te: '', isWelcome: true });

// Formats JSON or Array responses into human-readable Markdown
const formatAIResponse = (content) => {
  if (!content) return '';
  
  if (typeof content === 'string') {
    const trimmed = content.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        content = JSON.parse(trimmed);
      } catch (e) {}
    }
  }

  if (Array.isArray(content)) {
    return content.map(item => formatAIResponse(item)).join('\n\n');
  }

  if (typeof content === 'object' && content !== null) {
    let formattedText = '';
    for (const [key, value] of Object.entries(content)) {
      const humanKey = key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
      const humanValue = formatAIResponse(value);
      formattedText += `**${humanKey}:**\n${humanValue}\n\n`;
    }
    return formattedText.trim();
  }

  return String(content);
};

export default function Chat() {
  const { user } = useAuth();
  const { data: weatherData } = useLiveWeather();
  const { 
    speak, 
    stopSpeech, 
    elevenLabsKey, 
    isElevenLabsActive, 
    elevenLabsAgentId,
    saveElevenLabsKey, 
    toggleElevenLabs,
    saveElevenLabsAgentId
  } = useSpeech();

  const [farms, setFarms] = useState([]);
  const [farmsLoaded, setFarmsLoaded] = useState(false);

  // ── Chat session state ───────────────────────────────────────────────────
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // ElevenLabs Configuration Modal State
  const [isElevenLabsOpen, setIsElevenLabsOpen] = useState(false);
  const [tempKey, setTempKey] = useState(elevenLabsKey || '');
  const [tempAgentId, setTempAgentId] = useState(elevenLabsAgentId || '');

  // Speech Recognition (STT) State
  const [isRecording, setIsRecording] = useState(false);
  const [listeningLang, setListeningLang] = useState('hi'); // Default to Hindi
  const recognitionRef = useRef(null);

  const [messages, setMessages] = useState([
    WELCOME_MSG("Welcome to AgriShield AI Chat Advisor!\n\nI'm loading your farm data right now. Once ready, I can give you personalized advice based on your specific crops, soil types, and current weather conditions.\n\nAsk me anything about your farm!")
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Keep tempKey & tempAgentId in sync with SpeechContext
  useEffect(() => {
    setTempKey(elevenLabsKey || '');
  }, [elevenLabsKey]);

  useEffect(() => {
    setTempAgentId(elevenLabsAgentId || '');
  }, [elevenLabsAgentId]);

  // Load ElevenLabs Conversational AI Widget script dynamically
  useEffect(() => {
    if (elevenLabsAgentId) {
      const script = document.createElement('script');
      script.src = "https://elevenlabs.io/convai-widget/index.js";
      script.async = true;
      script.type = "text/javascript";
      document.body.appendChild(script);
    }
  }, [elevenLabsAgentId]);

  // ── Load farm data ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setFarmsLoaded(true); return; }
    farmService.getUserFarms(user.$id).then(f => setFarms(f)).catch(() => { }).finally(() => setFarmsLoaded(true));
  }, [user]);

  // ── Update welcome message once farms + weather ready ───────────────────
  useEffect(() => {
    if (!farmsLoaded) return;
    let text = "**AgriShield AI Advisor** is ready!\n\n";
    if (farms.length > 0) {
      text += `I've loaded your ${farms.length} farm${farms.length > 1 ? 's' : ''}: ${farms.map(f => `**${f.crop}** (${f.soil} soil)`).join(', ')}.\n`;
    } else {
      text += "No farms registered yet — I'll give you general expert advice.\n";
    }
    if (weatherData) text += `Current weather: **${weatherData.currentTemp}°C**, ${weatherData.condition}.\n`;
    text += "\nAsk me anything about your crops, soil, irrigation, pests, or fertilizers!";
    setMessages(prev => prev.some(m => !m.isWelcome) ? prev : [WELCOME_MSG(text)]);
  }, [farmsLoaded, weatherData]);

  // ── Load chat history ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    chatService.getUserChats(user.$id).then(docs => setChatList(docs)).catch(() => { });
  }, [user]);

  // ── Suggestion chips ─────────────────────────────────────────────────────
  const suggestionChips = React.useMemo(() => {
    if (farms.length > 0) {
      const f0 = farms[0], f1 = farms[1];
      return [
        { label: `Best fertilizer for ${f0.crop}?`, text: `What is the best fertilizer schedule and NPK ratio for my ${f0.crop} growing in ${f0.soil} soil?` },
        { label: `Pest control for ${f0.crop}`, text: `What are the most common pests attacking ${f0.crop} and how do I treat them organically?` },
        f1
          ? { label: `${f1.crop} irrigation schedule`, text: `How often should I irrigate my ${f1.crop} in ${f1.soil} soil given the current weather?` }
          : { label: 'Companion planting tips', text: `What companion plants work well alongside ${f0.crop} to improve soil nutrition and deter pests?` },
        { label: `Soil health for ${f0.soil} soil`, text: `How do I improve the fertility and structure of my ${f0.soil} soil over the next season?` },
      ];
    }
    return [
      { label: 'Best crop for Black Soil?', text: 'What are the most profitable and high-yielding crops to grow in Black Soil in Western India?' },
      { label: 'Monsoon pest remedies', text: 'What organic pest remedies do you recommend for protecting crops during the heavy monsoon season?' },
      { label: 'Companion planting tips', text: 'What are the best companion crops to plant alongside cotton to improve soil nutrition and deter pests?' },
      { label: 'Prepare clay soil', text: 'How should I prepare clay soil for sowing crops to ensure proper drainage and root growth?' },
    ];
  }, [farms]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const buildContext = () => ({
    farms: farms.map(f => ({ crop: f.crop, soil: f.soil })),
    weather: weatherData ? { currentTemp: weatherData.currentTemp, condition: weatherData.condition, humidity: weatherData.humidity, windSpeed: weatherData.windSpeed } : null,
    userName: user?.name || null,
  });

  const getWelcomeText = () => {
    let text = "**AgriShield AI Advisor** is ready!\n\n";
    if (farms.length > 0) {
      text += `I've loaded your ${farms.length} farm${farms.length > 1 ? 's' : ''}: ${farms.map(f => `**${f.crop}** (${f.soil} soil)`).join(', ')}.\n`;
    } else {
      text += "No farms registered yet — I'll give you general expert advice.\n";
    }
    if (weatherData) text += `Current weather: **${weatherData.currentTemp}°C**, ${weatherData.condition}.\n`;
    text += "\nAsk me anything about your crops, soil, irrigation, pests, or fertilizers!";
    return text;
  };

  // ── Send message + auto-save ─────────────────────────────────────────────
  const handleSendMessage = async (textToSend) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || isLoading) return;
    if (!textToSend) setInput('');

    // Stop recording if active
    if (isRecording) stopSpeechToText();

    const updatedMessages = [...messages, { role: 'user', content: messageText }];
    setMessages(updatedMessages);
    setIsLoading(true);

    const ctx = buildContext();

    try {
      const response = await aiService.sendChatMessage(updatedMessages, null, ctx.farms, ctx.weather, ctx.userName);
      
      const contentEn = formatAIResponse(response.content_en || response.content) || 'No response received.';
      const contentHi = formatAIResponse(response.content_hi) || '';
      const contentTe = formatAIResponse(response.content_te) || '';

      const aiMsg = { role: 'assistant', content: contentEn, content_hi: contentHi, content_te: contentTe };
      const fullMessages = [...updatedMessages, aiMsg];
      setMessages(fullMessages);

      // Auto-save to Appwrite
      if (user) {
        const serialized = serializeMessages(fullMessages);
        if (currentChatId) {
          const newTs = await chatService.updateChat(currentChatId, serialized);
          setChatList(prev => prev.map(c => c.$id === currentChatId ? { ...c, updated_at: newTs } : c));
        } else {
          const firstUserMsg = fullMessages.find(m => m.role === 'user')?.content || 'New Chat';
          const doc = await chatService.createChat(user.$id, firstUserMsg, serialized);
          setCurrentChatId(doc.$id);
          setChatList(prev => [{ $id: doc.$id, title: doc.title, updated_at: doc.updated_at }, ...prev]);
        }
      }
    } catch (error) {
      console.error('Chat failure:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm temporarily unavailable. Please check your connection and try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── New chat ─────────────────────────────────────────────────────────────
  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([WELCOME_MSG(getWelcomeText())]);
    setInput('');
  };

  // ── Load chat from history ───────────────────────────────────────────────
  const handleLoadChat = async (chat) => {
    if (chat.$id === currentChatId) return;
    const doc = await chatService.getChat(chat.$id);
    if (!doc) return;
    const msgs = deserializeMessages(doc.messages);
    setMessages(msgs.length > 0 ? msgs : [WELCOME_MSG(getWelcomeText())]);
    setCurrentChatId(chat.$id);
    setInput('');
  };

  // ── Delete chat ──────────────────────────────────────────────────────────
  const handleDeleteChat = (chatId, e) => {
    e.stopPropagation();
    setDeleteConfirmId(chatId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    await chatService.deleteChat(deleteConfirmId);
    setChatList(prev => prev.filter(c => c.$id !== deleteConfirmId));
    if (currentChatId === deleteConfirmId) handleNewChat();
    setDeleteConfirmId(null);
  };

  // ── Speech-to-Text Recognition ───────────────────────────────────────────
  const startSpeechToText = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    const langMap = {
      'en': 'en-US',
      'hi': 'hi-IN',
      'te': 'te-IN'
    };
    recognition.lang = langMap[listeningLang] || 'hi-IN';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      if (text) {
        setInput(prev => prev + (prev ? ' ' : '') + text);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const stopSpeechToText = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopSpeechToText();
    } else {
      startSpeechToText();
    }
  };

  // ── Search filter ────────────────────────────────────────────────────────
  const filteredChats = chatList.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-4 w-[95%] mx-auto pt-8 pb-12" style={{ height: 'calc(100vh - 40px)', minHeight: '520px' }}>

      {/* ── History Sidebar ── */}
      <aside className="w-[260px] shrink-0 flex flex-col bg-[#0A0F0A] border border-[#1C2A1C] rounded-2xl overflow-hidden">
        {/* New Chat button */}
        <div className="p-3 border-b border-[#1C2A1C]">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-md"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2.5 border-b border-[#1C2A1C] space-y-1.5">
          <div className={`flex items-center gap-2 bg-[#111A11] border rounded-xl px-3 py-2 transition-all ${searchQuery ? 'border-green-700/60' : 'border-[#1C2A1C]'}`}>
            <Search className={`w-3.5 h-3.5 shrink-0 transition-colors ${searchQuery ? 'text-green-500' : 'text-gray-500'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="bg-transparent border-none outline-none text-xs text-white placeholder-gray-500 w-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-gray-300 transition-colors shrink-0">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-[10px] px-1 font-semibold text-green-500/80">
              {filteredChats.length} result{filteredChats.length !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
          )}
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
              <MessageCircle className="w-8 h-8 text-gray-600" />
              <p className="text-xs text-gray-500 font-medium">
                {chatList.length === 0 ? 'Your chat history will appear here' : `No chats match "${searchQuery}"`}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-4">
              <AnimatePresence initial={false}>
                {groupChatsByDate(filteredChats).map(([groupName, groupChats]) => (
                  <div key={groupName} className="space-y-1">
                    <h3 className="px-3 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">{groupName}</h3>
                    {groupChats.map(chat => (
                      <motion.div
                        key={chat.$id}
                        layout
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.12 }}
                        onClick={() => handleLoadChat(chat)}
                        className={`group flex items-start gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${currentChatId === chat.$id
                            ? 'bg-[#111A11] border border-green-800/50 text-green-400'
                            : 'text-gray-400 hover:bg-[#111A11] hover:text-gray-200 border border-transparent'
                          }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-60" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate leading-snug">
                            <HighlightedTitle title={chat.title} query={searchQuery} />
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {formatChatDate(chat.updated_at)}
                          </p>
                        </div>
                        <button
                          onClick={e => handleDeleteChat(chat.$id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all shrink-0"
                          title="Delete chat"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2.5 border-t border-[#1C2A1C]">
          <p className="text-[10px] text-gray-600 text-center font-medium">
            {chatList.length} conversation{chatList.length !== 1 ? 's' : ''} saved
          </p>
        </div>
      </aside>

      {/* ── Main Chat Panel ── */}
      <div className="flex-1 flex flex-col space-y-4 overflow-hidden min-w-0">
        {/* Header */}
        <header className="flex items-start justify-between shrink-0 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-2xl shadow-md text-white">
                <MessageSquare className="w-5 h-5" />
              </div>
              AgriShield Chat Assistant
            </h1>
            <p className="text-gray-400 text-sm mt-1">Interactive agricultural support engine for diagnostics and tutorials</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Voice Settings Button */}
            <button
              onClick={() => setIsElevenLabsOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#111A11] hover:bg-[#1C2A1C] border border-[#1C2A1C] hover:border-green-800 rounded-xl text-xs font-bold text-gray-400 hover:text-green-400 transition-all active:scale-95 shadow-sm"
              title="ElevenLabs Settings"
            >
              <Settings className="w-3.5 h-3.5" />
              Voice Settings
            </button>

            <div className="flex items-center gap-1.5">
              {farmsLoaded && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${farms.length > 0 ? 'bg-green-50/10 text-green-400 border-green-950/30' : 'bg-gray-950/40 text-gray-500 border-gray-900'}`}>
                  {farms.length > 0 ? `${farms.length} farm${farms.length > 1 ? 's' : ''} loaded` : 'No farms'}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Chat window */}
        <div className="bg-[#0D150D] rounded-2xl border border-[#1C2A1C] shadow-sm flex flex-col flex-1 overflow-hidden">

          {/* Messages feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role !== 'user' && (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm border border-green-400">
                      <Leaf className="w-4 h-4" />
                    </div>
                  )}
                  <div className={`max-w-[78%] rounded-2xl px-5 py-3.5 text-[14.5px] leading-relaxed shadow-sm ${msg.role === 'user'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white rounded-br-none font-medium'
                      : 'bg-[#111A11] border border-[#1C2A1C] text-gray-300 rounded-bl-none'
                    }`}>
                    {msg.role === 'user' ? (
                      <span>{msg.content}</span>
                    ) : (
                      <>
                        <FormattedMessage content={msg.content} />
                        {!msg.isWelcome && (msg.content_hi || msg.content_te) && (
                          <div className="mt-2.5 flex flex-wrap gap-2 pt-2 border-t border-[#1C2A1C]/50">
                            {/* Play English */}
                            <button
                              onClick={() => speak(msg.content, 'en', 'English Response')}
                              className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 bg-[#1C2A1C] hover:bg-[#253825] px-2.5 py-1 rounded-lg transition-all active:scale-95 border border-[#2A3F2A]/30"
                              title="Listen in English"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              English
                            </button>
                            
                            {/* Play Hindi */}
                            {msg.content_hi && (
                              <button
                                onClick={() => speak(msg.content_hi, 'hi', 'हिंदी सलाह')}
                                className="flex items-center gap-1.5 text-xs font-bold text-green-400 hover:text-green-300 bg-[#1C2A1C] hover:bg-[#253825] px-2.5 py-1 rounded-lg transition-all active:scale-95 border border-[#2A3F2A]/30"
                                title="हिंदी में सुनें"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                                हिंदी
                              </button>
                            )}

                            {/* Play Telugu */}
                            {msg.content_te && (
                              <button
                                onClick={() => speak(msg.content_te, 'te', 'తెలుగు సలహా')}
                                className="flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 bg-[#1C2A1C] hover:bg-[#253825] px-2.5 py-1 rounded-lg transition-all active:scale-95 border border-[#2A3F2A]/30"
                                title="తెలుగులో వినండి"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                                తెలుగు
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex gap-3.5 justify-start">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm border border-green-400">
                  <Leaf className="w-4 h-4" />
                </div>
                <div className="bg-[#111A11] border border-[#1C2A1C] rounded-2xl rounded-bl-none px-5 py-3.5 flex items-center gap-2 shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-green-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-gray-500 font-medium">Analysing your farm data...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggestion chips */}
          {messages.length <= 2 && !isLoading && (
            <div className="px-6 py-4 bg-[#0D150D] border-t border-[#1C2A1C] shrink-0">
              <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                {farms.length > 0 ? 'Suggestions based on your farms' : 'Popular farming questions'}
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip.text)}
                    className="bg-[#111A11] hover:bg-[#1C2A1C] border border-[#1C2A1C] hover:border-green-700 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-400 hover:text-green-400 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                  >
                    {chip.label}
                    <ArrowRight className="w-3 h-3 text-gray-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input bar */}
          <div className="p-4 bg-[#0D150D] border-t border-[#1C2A1C] shrink-0">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex items-center gap-3 bg-[#111A11] border border-[#1C2A1C] rounded-2xl p-1.5 focus-within:ring-1 focus-within:ring-green-500 transition-all shadow-inner"
            >
              {/* Mic STT Button */}
              <button
                type="button"
                onClick={toggleRecording}
                className={`p-3 rounded-xl transition-all active:scale-95 shrink-0 flex items-center justify-center relative ${
                  isRecording 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40' 
                    : 'bg-[#1C2A1C] hover:bg-[#243624] text-gray-400 hover:text-green-400 border border-transparent'
                }`}
                title={isRecording ? "Stop listening" : "Speak to AI"}
              >
                {isRecording ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
                {isRecording && (
                  <span className="absolute -inset-1 rounded-xl bg-red-500/10 animate-ping pointer-events-none" />
                )}
              </button>

              {/* Listening language selector */}
              <div className="flex bg-[#0D150D] border border-[#1C2A1C] rounded-lg p-0.5 shrink-0">
                {['en', 'hi', 'te'].map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setListeningLang(l)}
                    className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-md transition-all ${
                      listeningLang === l 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isRecording ? "Listening..." : farms.length > 0 ? `Ask about your ${farms[0]?.crop} or any crop challenge...` : 'Ask about crops, soil, pests, irrigation...'}
                className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-sm text-white placeholder-gray-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-3 rounded-xl transition-all active:scale-95 disabled:opacity-40 shrink-0 shadow-md flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── ElevenLabs Settings Modal ── */}
      <AnimatePresence>
        {isElevenLabsOpen && (
          <motion.div
            key="elevenlabs-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setIsElevenLabsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={e => e.stopPropagation()}
              className="w-[360px] bg-[#0D150D] border border-[#1C2A1C] rounded-2xl overflow-hidden shadow-2xl animate-fade-in"
            >
              {/* Voice accent bar */}
              <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-600" />

              <div className="p-5">
                {/* Icon + heading */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">ElevenLabs AI Assistant</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Premium Female Voice (Bella)</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Toggle */}
                  <div className="flex items-center justify-between bg-[#111A11] border border-[#1C2A1C] rounded-xl px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">Enable ElevenLabs Voice</span>
                      <span className="text-[10px] text-gray-500">Uses high-quality multilingual model</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isElevenLabsActive}
                        onChange={(e) => toggleElevenLabs(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-[#1C2A1C] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600 peer-checked:after:bg-white"></div>
                    </label>
                  </div>

                  {/* API Key */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 px-1">ElevenLabs API Key</label>
                    <input
                      type="password"
                      value={tempKey}
                      onChange={(e) => setTempKey(e.target.value)}
                      placeholder="Paste your ElevenLabs key..."
                      className="w-full bg-[#111A11] border border-[#1C2A1C] focus:border-green-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition-all"
                    />
                    <p className="text-[10px] text-gray-500 px-1">
                      If left blank, it will try the server's environment key or fall back to local voice.
                    </p>
                  </div>

                  {/* Agent ID */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 px-1">ElevenLabs Conversational Agent ID</label>
                    <input
                      type="text"
                      value={tempAgentId}
                      onChange={(e) => setTempAgentId(e.target.value)}
                      placeholder="e.g. 21m00Tcm4TlvDq8ikWAM"
                      className="w-full bg-[#111A11] border border-[#1C2A1C] focus:border-green-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition-all"
                    />
                    <p className="text-[10px] text-gray-500 px-1">
                      Add your Agent ID from <a href="https://elevenlabs.io/app/agents" target="_blank" rel="noreferrer" className="text-green-500 hover:underline">ElevenLabs Agents</a> to display the live widget.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2.5 mt-6">
                  <button
                    onClick={() => setIsElevenLabsOpen(false)}
                    className="flex-1 px-4 py-2.5 text-xs font-bold text-gray-300 bg-[#1C2A1C] hover:bg-[#243624] border border-[#2A3A2A] rounded-xl transition-all active:scale-95"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      saveElevenLabsKey(tempKey);
                      saveElevenLabsAgentId(tempAgentId);
                      setIsElevenLabsOpen(false);
                    }}
                    className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirmation Modal ── */}
      <AnimatePresence>
        {deleteConfirmId && (() => {
          const chat = chatList.find(c => c.$id === deleteConfirmId);
          return (
            <motion.div
              key="delete-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteConfirmId(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                onClick={e => e.stopPropagation()}
                className="w-[320px] bg-[#0D150D] border border-[#1C2A1C] rounded-2xl overflow-hidden shadow-2xl"
              >
                {/* Red accent bar */}
                <div className="h-1 bg-gradient-to-r from-red-600 to-rose-500" />

                <div className="p-5">
                  {/* Icon + heading */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Delete this chat?</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">This cannot be undone.</p>
                    </div>
                  </div>

                  {/* Chat title preview */}
                  {chat && (
                    <div className="bg-[#111A11] border border-[#1C2A1C] rounded-xl px-3.5 py-2.5 mb-5">
                      <p className="text-xs text-gray-300 font-medium leading-snug line-clamp-2">"{chat.title}"</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="flex-1 px-4 py-2.5 text-xs font-bold text-gray-300 bg-[#1C2A1C] hover:bg-[#243624] border border-[#2A3A2A] rounded-xl transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-xl transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── ElevenLabs Conversational Widget ── */}
      {elevenLabsAgentId && (
        <div className="fixed bottom-6 right-6 z-50 shadow-2xl">
          <elevenlabs-convai agent-id={elevenLabsAgentId}></elevenlabs-convai>
        </div>
      )}
    </div>
  );
}
