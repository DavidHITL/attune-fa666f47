
import { generateResponse } from "../responseGenerator";
import * as apiService from "../response/apiService";
import * as messagePreparation from "../response/messagePreparation";
import { toast } from "sonner";

// Mock dependencies
jest.mock("../response/apiService", () => ({
  callChatResponseApi: jest.fn()
}));

jest.mock("../services/messages/messageUtils", () => ({
  createMessageObject: jest.fn().mockImplementation((text, isUser) => ({
    id: "test-id",
    text,
    isUser,
    timestamp: new Date()
  })),
  generateUniqueId: jest.fn().mockReturnValue("test-id")
}));

jest.mock("../response/messagePreparation", () => ({
  prepareConversationHistory: jest.fn(),
  generateLocalResponse: jest.fn().mockReturnValue("Local response")
}));

jest.mock("../response/contextPreparation", () => ({
  prepareContextData: jest.fn().mockResolvedValue({
    recentMessages: ["Recent message"],
    therapyConcepts: [],
    therapySources: []
  })
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn()
  }
}));

describe("generateResponse", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should use AI response when useLocalFallback is false", async () => {
    // Setup mocks
    const mockApiResponse = "AI response";
    (apiService.callChatResponseApi as jest.Mock).mockResolvedValue(mockApiResponse);
    (messagePreparation.prepareConversationHistory as jest.Mock).mockReturnValue([]);
    
    const setUseLocalFallback = jest.fn();
    
    // Call function
    const result = await generateResponse(
      "Hello",
      [],
      false,
      setUseLocalFallback,
      { sessionProgress: 0 }
    );
    
    // Assertions
    expect(apiService.callChatResponseApi).toHaveBeenCalled();
    expect(result.text).toBe(mockApiResponse);
    expect(result.isUser).toBe(false);
    expect(setUseLocalFallback).not.toHaveBeenCalled();
  });

  it("should fall back to local response when API fails", async () => {
    // Setup mocks
    (apiService.callChatResponseApi as jest.Mock).mockRejectedValue(new Error("API error"));
    (messagePreparation.prepareConversationHistory as jest.Mock).mockReturnValue([]);
    
    const setUseLocalFallback = jest.fn();
    
    // Call function
    const result = await generateResponse(
      "Hello",
      [],
      false,
      setUseLocalFallback
    );
    
    // Assertions
    expect(apiService.callChatResponseApi).toHaveBeenCalled();
    expect(messagePreparation.generateLocalResponse).toHaveBeenCalled();
    expect(result.text).toBe("Local response");
    expect(setUseLocalFallback).toHaveBeenCalledWith(true);
    expect(toast.error).toHaveBeenCalled();
  });

  it("should use local response directly when useLocalFallback is true", async () => {
    // Setup mocks
    (messagePreparation.generateLocalResponse as jest.Mock).mockReturnValue("Local response");
    
    const setUseLocalFallback = jest.fn();
    
    // Call function
    const result = await generateResponse(
      "Hello",
      [],
      true,
      setUseLocalFallback
    );
    
    // Assertions
    expect(apiService.callChatResponseApi).not.toHaveBeenCalled();
    expect(messagePreparation.generateLocalResponse).toHaveBeenCalled();
    expect(result.text).toBe("Local response");
    expect(setUseLocalFallback).not.toHaveBeenCalled();
  });

  it("should return error message for empty input", async () => {
    // Call function with empty input
    const result = await generateResponse(
      "",
      [],
      false,
      jest.fn()
    );
    
    // Assertions
    expect(result.text).toContain("didn't receive");
    expect(result.isUser).toBe(false);
  });
});
