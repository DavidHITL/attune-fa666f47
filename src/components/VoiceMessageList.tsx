
import React, { useRef, useEffect } from 'react';
import VoiceMessageBubble from './VoiceMessageBubble';

interface VoiceMessageListProps {
  messages: Array<{role: 'user' | 'assistant', text: string}>;
  transcript: string;
}

const VoiceMessageList: React.FC<VoiceMessageListProps> = ({ messages, transcript }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, transcript]);

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 rounded-md my-4 min-h-[300px]">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          Speak naturally with the AI assistant or type a message below.
        </div>
      ) : (
        messages.map((message, index) => (
          <VoiceMessageBubble key={index} message={message} />
        ))
      )}
      
      {transcript && (
        <div className="text-right mb-4">
          <div className="inline-block px-4 py-2 rounded-lg bg-blue-500 text-white rounded-br-none">
            {transcript}
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default VoiceMessageList;
