import React, { useEffect } from 'react';
import { useSpeech } from '../context/SpeechContext';

const ElevenLabsAssistant = () => {
  const { elevenLabsAgentId } = useSpeech();
  const agentId = elevenLabsAgentId || import.meta.env.VITE_ELEVENLABS_AGENT_ID || "agent_4001kv013qt6eh4a7ywnd2sv6yzd";

  useEffect(() => {
    // Load ElevenLabs Conversational AI Widget Script
    if (!document.querySelector('script[src*="convai-widget"]')) {
      const script = document.createElement('script');
      script.src = 'https://elevenlabs.io/convai-widget/index.js';
      script.async = true;
      script.type = 'text/javascript';
      document.body.appendChild(script);
    }
  }, []);

  if (!agentId) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <elevenlabs-convai
        agent-id={agentId}
        avatar-orb-color-1="#22c55e"
        avatar-orb-color-2="#15803d"
        action-text="Talk to AgriShield AI"
        start-call-text="Start Agronomist Session"
        end-call-text="End Session"
      ></elevenlabs-convai>
    </div>
  );
};

export default ElevenLabsAssistant;
