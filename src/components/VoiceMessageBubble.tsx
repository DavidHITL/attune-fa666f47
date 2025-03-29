
import React from 'react';
import { format } from 'date-fns';

interface VoiceMessageBubbleProps {
  message: {
    role: 'user' | 'assistant';
    text: string;
    timestamp?: Date;
  };
}

const VoiceMessageBubble: React.FC<VoiceMessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`mb-4 ${isUser ? 'text-right' : 'text-left'}`}>
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div 
          className={`inline-block px-4 py-2 max-w-[80%] rounded-lg ${
            isUser 
              ? 'bg-blue-500 text-white rounded-br-none' 
              : 'bg-gray-200 text-gray-800 rounded-bl-none'
          }`}
        >
          {message.text}
          
          {message.timestamp && (
            <div className={`text-xs mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
              {format(message.timestamp, 'p')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceMessageBubble;
