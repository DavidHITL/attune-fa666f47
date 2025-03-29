
export interface RequestBody {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  sessionProgress?: number; // 0-100 percentage through the session
}

export interface AnthropicResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  id: string;
  model: string;
  role: string;
  type: string;
}

export interface ChatResponseBody {
  reply: string;
  success: boolean;
}

export interface ErrorResponseBody {
  error: string;
  success: false;
}
