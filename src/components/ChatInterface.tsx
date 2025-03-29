
import React, { useState, useRef, useEffect } from "react";
import MessageBubble, { Message } from "./MessageBubble";
import ChatInput from "./ChatInput";

const initialMessages: Message[] = [
  {
    id: "1",
    text: "Hi there. How are you feeling today?",
    isUser: false,
    timestamp: new Date()
  },
  {
    id: "2",
    text: "I feel a bit overwhelmed, but grateful.",
    isUser: true,
    timestamp: new Date()
  },
  {
    id: "3",
    text: "That's okay. Let's take a moment to pause and breathe together.",
    isUser: false,
    timestamp: new Date()
  }
];

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (text: string) => {
    const newUserMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date()
    };

    setMessages((prevMessages) => [...prevMessages, newUserMessage]);

    // Simulate bot response after a delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Thank you for sharing. How else can I help you today?",
        isUser: false,
        timestamp: new Date()
      };
      setMessages((prevMessages) => [...prevMessages, botResponse]);
    }, 1000);
  };

  // Auto-scroll to the most recent message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="max-w-2xl mx-auto w-full">
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default ChatInterface;
