
// Simple fallback function for local message processing
export const generateLocalResponse = (message: string): string => {
  if (message.toLowerCase().includes("hello") || message.toLowerCase().includes("hi")) {
    return "Hello! How are you feeling today?";
  } else if (message.toLowerCase().includes("good") || message.toLowerCase().includes("fine")) {
    return "I'm glad to hear that! Is there anything specific you'd like to talk about?";
  } else if (message.toLowerCase().includes("bad") || message.toLowerCase().includes("not good")) {
    return "I'm sorry to hear that. Would you like to share more about what's bothering you?";
  } else if (message.toLowerCase().includes("thank")) {
    return "You're welcome! I'm here to support you.";
  } else {
    return "Thank you for sharing. I'm listening and here to support you. Feel free to tell me more.";
  }
};
