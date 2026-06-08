import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Sparkles, Trash2, Sprout, ArrowRight, Leaf, Thermometer, Wind, CloudRain, Volume2 } from 'lucide-react';
import { aiService } from '../services/aiService';
import { farmService } from '../services/farmService';
import { useAuth } from '../context/AuthContext';
import useLiveWeather from '../hooks/useLiveWeather';
import { useSpeech } from '../context/SpeechContext';

// Renders markdown-like formatting: **bold**, bullet points, numbered lists
function FormattedMessage({ content }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        // Render bullet lines
        const isBullet = /^[-•*]\s+/.test(line);
        const isNumbered = /^\d+\.\s+/.test(line);
        const cleanLine = line.replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '');

        // Bold text: **text**
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

        // Section headers (lines ending in : that are short)
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

export default function Chat() {
  const { user } = useAuth();
  const { data: weatherData } = useLiveWeather();
  const { speak } = useSpeech();
  const [farms, setFarms] = useState([]);
  const [farmsLoaded, setFarmsLoaded] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Welcome to AgriShield AI Chat Advisor! 🌾\n\nI'm loading your farm data right now. Once ready, I can give you personalized advice based on your specific crops, soil types, and current weather conditions.\n\nAsk me anything about your farm!",
      content_hi: '',
      isWelcome: true,
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Load farm data on mount
  useEffect(() => {
    const loadFarms = async () => {
      if (!user) {
        setFarmsLoaded(true);
        return;
      }
      try {
        const userFarms = await farmService.getUserFarms(user.$id);
        setFarms(userFarms);
      } catch (e) {
        console.warn('[Chat] Could not load farms:', e);
      } finally {
        setFarmsLoaded(true);
      }
    };
    loadFarms();
  }, [user]);

  // Update welcome message once farms and weather are loaded
  useEffect(() => {
    if (!farmsLoaded) return;
    const farmCount = farms.length;
    const weatherReady = !!weatherData;
    let welcomeText = "🌾 **AgriShield AI Advisor** is ready!\n\n";
    if (farmCount > 0) {
      const farmSummary = farms.map(f => `**${f.crop}** (${f.soil} soil)`).join(', ');
      welcomeText += `I've loaded your ${farmCount} farm${farmCount > 1 ? 's' : ''}: ${farmSummary}.\n`;
    } else {
      welcomeText += "No farms registered yet — I'll give you general expert advice.\n";
    }
    if (weatherReady) {
      welcomeText += `Current weather: **${weatherData.currentTemp}°C**, ${weatherData.condition}.\n`;
    }
    welcomeText += "\nAsk me anything about your crops, soil, irrigation, pests, or fertilizers!";

    setMessages([{ role: 'assistant', content: welcomeText, content_hi: '', isWelcome: true }]);
  }, [farmsLoaded, weatherData]);

  // Dynamic suggestion chips based on actual farm data
  const suggestionChips = React.useMemo(() => {
    if (farms.length > 0) {
      const first = farms[0];
      const second = farms[1];
      return [
        { label: `Best fertilizer for ${first.crop}?`, text: `What is the best fertilizer schedule and NPK ratio for my ${first.crop} growing in ${first.soil} soil?` },
        { label: `Pest control for ${first.crop}`, text: `What are the most common pests attacking ${first.crop} and how do I treat them organically?` },
        second
          ? { label: `${second.crop} irrigation schedule`, text: `How often should I irrigate my ${second.crop} in ${second.soil} soil given the current weather?` }
          : { label: 'Companion planting tips', text: `What companion plants work well alongside ${first.crop} to improve soil nutrition and deter pests?` },
        { label: `Soil health for ${first.soil} soil`, text: `How do I improve the fertility and structure of my ${first.soil} soil over the next season?` },
      ];
    }
    return [
      { label: 'Best crop for Black Soil?', text: 'What are the most profitable and high-yielding crops to grow in Black Soil in Western India?' },
      { label: 'Monsoon pest remedies', text: 'What organic pest remedies do you recommend for protecting crops during the heavy monsoon season?' },
      { label: 'Companion planting tips', text: 'What are the best companion crops to plant alongside cotton to improve soil nutrition and deter pests?' },
      { label: 'Prepare clay soil', text: 'How should I prepare clay soil for sowing crops to ensure proper drainage and root growth?' },
    ];
  }, [farms]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContext = () => ({
    farms: farms.map(f => ({ crop: f.crop, soil: f.soil })),
    weather: weatherData
      ? {
          currentTemp: weatherData.currentTemp,
          condition: weatherData.condition,
          humidity: weatherData.humidity,
          windSpeed: weatherData.windSpeed,
        }
      : null,
    userName: user?.name || null,
  });

  const handleSendMessage = async (textToSend) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || isLoading) return;
    if (!textToSend) setInput('');

    const updatedMessages = [...messages, { role: 'user', content: messageText }];
    setMessages(updatedMessages);
    setIsLoading(true);

    const ctx = buildContext();

    try {
      const response = await aiService.sendChatMessage(
        updatedMessages,
        null,
        ctx.farms,
        ctx.weather,
        ctx.userName
      );
      // Handle new bilingual response format {content_en, content_hi} and old {content}
      const contentEn = response.content_en || response.content || '🌾 No response received.';
      const contentHi = response.content_hi || '';
      setMessages(prev => [...prev, { role: 'assistant', content: contentEn, content_hi: contentHi }]);
    } catch (error) {
      console.error('Chat failure:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '🌾 I\'m temporarily unavailable. Please check your connection and try again.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([{
      role: 'assistant',
      content: '🌱 Chat cleared! What farming challenge can I help you with today?',
      content_hi: '',
    }]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12 flex flex-col" style={{ height: 'calc(100vh - 140px)', minHeight: '520px' }}>
      {/* Header */}
      <header className="flex items-start justify-between shrink-0 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-2xl shadow-md text-white">
              <MessageSquare className="w-5 h-5" />
            </div>
            AgriShield AI Advisor
          </h1>
          <p className="text-gray-500 text-sm mt-1">Personalized farming advice powered by your farm data.</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Context badges */}
          <div className="flex items-center gap-1.5">
            {farmsLoaded && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${farms.length > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                <Sprout className="w-3 h-3" />
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

          {messages.length > 1 && (
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200/50 rounded-xl transition-all active:scale-95 bg-white shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </header>

      {/* Main chat window */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col flex-1 overflow-hidden">

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

                <div
                  className={`max-w-[78%] rounded-2xl px-5 py-3.5 text-[14.5px] leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white rounded-br-none font-medium'
                      : 'bg-gray-50 border border-gray-150 text-gray-800 rounded-bl-none'
                  }`}
                >
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

        {/* Suggestion Chips — shown only when fresh */}
        {messages.length === 1 && (
          <div className="px-6 py-4 bg-gradient-to-b from-transparent to-gray-50/80 border-t border-gray-100 shrink-0">
            <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
              {farms.length > 0 ? 'Suggestions based on your farms' : 'Popular farming questions'}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip.text)}
                  className="bg-white hover:bg-green-50/60 border border-gray-200/80 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-600 hover:text-green-700 hover:border-green-300 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  {chip.label}
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex gap-3 bg-gray-50 border border-gray-200/80 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-green-400 focus-within:bg-white transition-all shadow-inner"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={farms.length > 0 ? `Ask about your ${farms[0]?.crop} or any crop challenge...` : 'Ask about crops, soil, pests, irrigation...'}
              className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-sm text-gray-800 placeholder-gray-400"
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
  );
}
