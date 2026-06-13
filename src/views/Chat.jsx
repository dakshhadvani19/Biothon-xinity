import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Sparkles, Trash2, Sprout, ArrowRight, Leaf, Thermometer, Wind, CloudRain, Volume2, Plus, Search, Clock, MessageCircle } from 'lucide-react';
import { aiService } from '../services/aiService';
import { farmService } from '../services/farmService';
import { chatService, serializeMessages, deserializeMessages, formatChatDate } from '../services/chatService';
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

const WELCOME_MSG = (text) => ({ role: 'assistant', content: text, content_hi: '', isWelcome: true });

export default function Chat() {
  const { user } = useAuth();
  const { data: weatherData } = useLiveWeather();
  const { speak } = useSpeech();
  const [farms, setFarms] = useState([]);
  const [farmsLoaded, setFarmsLoaded] = useState(false);

  // ── Chat session state ───────────────────────────────────────────────────
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [messages, setMessages] = useState([
    WELCOME_MSG("Welcome to AgriShield AI Chat Advisor!\n\nI'm loading your farm data right now. Once ready, I can give you personalized advice based on your specific crops, soil types, and current weather conditions.\n\nAsk me anything about your farm!")
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // ── Load farm data ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setFarmsLoaded(true); return; }
    farmService.getUserFarms(user.$id).then(f => setFarms(f)).catch(() => {}).finally(() => setFarmsLoaded(true));
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
    setMessages([WELCOME_MSG(text)]);
  }, [farmsLoaded, weatherData]);

  // ── Load chat history ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    chatService.getUserChats(user.$id).then(docs => setChatList(docs)).catch(() => {});
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

    const updatedMessages = [...messages, { role: 'user', content: messageText }];
    setMessages(updatedMessages);
    setIsLoading(true);

    const ctx = buildContext();

    try {
      const response = await aiService.sendChatMessage(updatedMessages, null, ctx.farms, ctx.weather, ctx.userName);
      let contentEn = response.content_en || response.content || 'No response received.';
      let contentHi = response.content_hi || '';
      if (typeof contentEn !== 'string') contentEn = Array.isArray(contentEn) ? contentEn.join('\n') : JSON.stringify(contentEn);
      if (typeof contentHi !== 'string') contentHi = Array.isArray(contentHi) ? contentHi.join('\n') : JSON.stringify(contentHi);

      const aiMsg = { role: 'assistant', content: contentEn, content_hi: contentHi };
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
  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();
    await chatService.deleteChat(chatId);
    setChatList(prev => prev.filter(c => c.$id !== chatId));
    if (currentChatId === chatId) handleNewChat();
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
        <div className="px-3 py-2.5 border-b border-[#1C2A1C]">
          <div className="flex items-center gap-2 bg-[#111A11] border border-[#1C2A1C] rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="bg-transparent border-none outline-none text-xs text-white placeholder-gray-500 w-full"
            />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
              <MessageCircle className="w-8 h-8 text-gray-600" />
              <p className="text-xs text-gray-500 font-medium">
                {chatList.length === 0 ? 'Your chat history will appear here' : 'No chats match your search'}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredChats.map(chat => (
                <div
                  key={chat.$id}
                  onClick={() => handleLoadChat(chat)}
                  className={`group flex items-start gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    currentChatId === chat.$id
                      ? 'bg-[#111A11] border border-green-800/50 text-green-400'
                      : 'text-gray-400 hover:bg-[#111A11] hover:text-gray-200 border border-transparent'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-60" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate leading-snug">{chat.title}</p>
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
                </div>
              ))}
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
            <div className="flex items-center gap-1.5">
              {farmsLoaded && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${farms.length > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                  {farms.length > 0 ? `${farms.length} farm${farms.length > 1 ? 's' : ''} loaded` : 'No farms'}
                </span>
              )}
              {weatherData && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                  <Thermometer className="w-3 h-3" />
                  {weatherData.currentTemp}°C
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
                  <div className={`max-w-[78%] rounded-2xl px-5 py-3.5 text-[14.5px] leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white rounded-br-none font-medium'
                      : 'bg-[#111A11] border border-[#1C2A1C] text-gray-300 rounded-bl-none'
                  }`}>
                    {msg.role === 'user' ? (
                      <span>{msg.content}</span>
                    ) : (
                      <>
                        <FormattedMessage content={msg.content} />
                        {msg.content_hi && !msg.isWelcome && (
                          <button
                            onClick={() => speak(msg.content_hi, 'AI सलाह')}
                            className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-green-600 hover:text-green-700 hover:bg-green-50 px-2.5 py-1 rounded-lg transition-all active:scale-95 border border-green-200/50"
                            title="हिंदी में सुनें"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            हिंदी में सुनें
                          </button>
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
                <div className="bg-gray-50 border border-gray-150 rounded-2xl rounded-bl-none px-5 py-3.5 flex items-center gap-2 shadow-sm">
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
              className="flex gap-3 bg-[#111A11] border border-[#1C2A1C] rounded-2xl p-1.5 focus-within:ring-1 focus-within:ring-green-500 transition-all shadow-inner"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={farms.length > 0 ? `Ask about your ${farms[0]?.crop} or any crop challenge...` : 'Ask about crops, soil, pests, irrigation...'}
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
            <p className="text-[11px] text-gray-400 text-center mt-2 font-medium">
              Powered by Groq · Answers are grounded in your registered farm data
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
