import React, { useEffect, useState } from 'react';

const ElevenLabsAssistant = () => {
  const [agentId, setAgentId] = useState(() => {
    const stored = localStorage.getItem('elevenlabs_agent_id');
    // Clear old placeholder/invalid IDs to prevent them from overriding the correct default
    if (stored === "b421a14c-1db2-4ffb-a25e-e47a9561de61") {
      localStorage.removeItem('elevenlabs_agent_id');
      return "agent_4001kv013qt6eh4a7ywnd2sv6yzd";
    }
    return stored || import.meta.env.VITE_ELEVENLABS_AGENT_ID || "agent_4001kv013qt6eh4a7ywnd2sv6yzd";
  });

  useEffect(() => {
    // Load ElevenLabs Conversational AI Widget Script
    if (!document.querySelector('script[src*="convai-widget"]')) {
      const script = document.createElement('script');
      script.src = 'https://elevenlabs.io/convai-widget/index.js';
      script.async = true;
      script.type = 'text/javascript';
      document.body.appendChild(script);
    }

    // Listener to update agent id if changed in the modal
    const handleStorageChange = () => {
      const storedId = localStorage.getItem('elevenlabs_agent_id');
      if (storedId) {
        setAgentId(storedId);
      }
    };

    window.addEventListener('elevenlabs_agent_id_updated', handleStorageChange);
    return () => {
      window.removeEventListener('elevenlabs_agent_id_updated', handleStorageChange);
    };
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
