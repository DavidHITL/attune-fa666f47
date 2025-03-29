
import React from 'react';

interface VoiceMessageBubbleProps {
  message: {
    role: 'user' | 'assistant';
    text: string;
  };
}

const VoiceMessageBubble: React.FC<VoiceMessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`mb-4 ${isUser ? 'text-right' : 'text-left'}`}>
      <div 
        className={`inline-block px-4 py-2 rounded-lg ${
          isUser 
            ? 'bg-blue-500 text-white rounded-br-none' 
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
        }`}
      >
        {message.text}
      </div>
    </div>
  );
};

export default VoiceMessageBubble;
