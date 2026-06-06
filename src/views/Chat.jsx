import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Sparkles, Trash2, Sprout, ArrowRight, CornerDownLeft } from 'lucide-react';
import { aiService } from '../services/aiService';

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Welcome to AgriShield AI Chat Advisor! 🌾\n\nI can help you with crop advice, organic pest remedies, companion planting recommendations, or soil management tips. Ask me anything about your farm!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Quick prompt chips
  const suggestionChips = [
    { label: "Best crop for Black Soil?", text: "What are the most profitable and high-yielding crops to grow in Black Soil in Western India?" },
    { label: "Monsoon pest remedies", text: "What organic pest remedies do you recommend for protecting crops during the heavy monsoon season?" },
    { label: "Companion planting with Cotton", text: "What are the best companion crops to plant alongside cotton to improve soil nutrition and deter pests?" },
    { label: "Prepare clay soil", text: "How should I prepare clay soil for sowing crops to ensure proper drainage and root growth?" }
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || isLoading) return;

    if (!textToSend) setInput('');

    const updatedMessages = [...messages, { role: 'user', content: messageText }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await aiService.sendChatMessage(updatedMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: response.content }]);
    } catch (error) {
      console.error("Chat failure:", error);
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', content: "I apologize, but I am unable to connect to the advisory server at the moment. Please verify your connection and try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Chat cleared. Ask me another agronomic question!"
      }
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
      {/* Header */}
      <header className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-2xl shadow-md text-white">
              <MessageSquare className="w-6 h-6" />
            </div>
            AgriShield AI Advisor
          </h1>
          <p className="text-gray-500 text-sm mt-1">Get immediate technical recommendations, suggestions, and tips.</p>
        </div>

        {messages.length > 1 && (
          <button 
            onClick={handleClearChat}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200/50 rounded-xl transition-all active:scale-95 bg-white shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Chat
          </button>
        )}
      </header>

      {/* Main chat window container */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col flex-1 overflow-hidden">
        
        {/* Messages feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role !== 'user' && (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-extrabold shrink-0 shadow-sm border border-green-400">
                    AI
                  </div>
                )}
                
                <div 
                  className={`max-w-[75%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white rounded-br-none font-medium'
                      : 'bg-gray-50 border border-gray-150 text-gray-800 rounded-bl-none whitespace-pre-wrap'
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <div className="flex gap-3.5 justify-start">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-extrabold shrink-0 shadow-sm border border-green-400">
                AI
              </div>
              <div className="bg-gray-50 border border-gray-150 rounded-2xl rounded-bl-none px-5 py-3.5 text-sm text-gray-500 flex items-center gap-2 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                Formulating advice...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips - only show if there is minimal conversation */}
        {messages.length === 1 && (
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 shrink-0">
            <p className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
              Suggested topics to ask
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip.text)}
                  className="bg-white hover:bg-green-50/40 border border-gray-200/80 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-600 hover:text-green-700 hover:border-green-300 transition-all flex items-center gap-1 shadow-sm active:scale-95"
                >
                  {chip.label}
                  <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-green-600" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input box */}
        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} 
            className="flex gap-3 bg-gray-50 border border-gray-200/80 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-green-500 focus-within:bg-white transition-all shadow-inner"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for recommendations, soil treatment plans, or companion crops..."
              className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-sm text-gray-800 placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 shrink-0 shadow-md flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
