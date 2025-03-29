
import { generateResponse } from "../responseGenerator";
import { callChatApi } from "../chatApiService";
import { generateLocalResponse } from "../../utils/localResponseGenerator";
import { toast } from "@/hooks/use-toast";

// Mock dependencies
jest.mock("../chatApiService", () => ({
  callChatApi: jest.fn(),
  convertMessagesToApiFormat: jest.fn(),
  createMessageObject: jest.fn().mockImplementation((text, isUser) => ({
    id: "test-id",
    text,
    isUser,
    timestamp: new Date()
  })),
  generateUniqueId: jest.fn().mockReturnValue("test-id")
}));

jest.mock("../../utils/localResponseGenerator", () => ({
  generateLocalResponse: jest.fn()
}));

jest.mock("@/hooks/use-toast", () => ({
  toast: jest.fn()
}));

describe("generateResponse", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should use AI response when useLocalFallback is false", async () => {
    // Setup mocks
    const mockApiResponse = "AI response";
    (callChatApi as jest.Mock).mockResolvedValue(mockApiResponse);
    
    const setUseLocalFallback = jest.fn();
    
    // Call function
    const result = await generateResponse(
      "Hello",
      [],
      false,
      setUseLocalFallback
    );
    
    // Assertions
    expect(callChatApi).toHaveBeenCalled();
    expect(result.text).toBe(mockApiResponse);
    expect(result.isUser).toBe(false);
    expect(setUseLocalFallback).not.toHaveBeenCalled();
  });

  it("should fall back to local response when API fails", async () => {
    // Setup mocks
    (callChatApi as jest.Mock).mockRejectedValue(new Error("API error"));
    (generateLocalResponse as jest.Mock).mockReturnValue("Local response");
    
    const setUseLocalFallback = jest.fn();
    
    // Call function
    const result = await generateResponse(
      "Hello",
      [],
      false,
      setUseLocalFallback
    );
    
    // Assertions
    expect(callChatApi).toHaveBeenCalled();
    expect(generateLocalResponse).toHaveBeenCalled();
    expect(result.text).toBe("Local response");
    expect(setUseLocalFallback).toHaveBeenCalledWith(true);
  });

  it("should use local response directly when useLocalFallback is true", async () => {
    // Setup mocks
    (generateLocalResponse as jest.Mock).mockReturnValue("Local response");
    
    const setUseLocalFallback = jest.fn();
    
    // Call function
    const result = await generateResponse(
      "Hello",
      [],
      true,
      setUseLocalFallback
    );
    
    // Assertions
    expect(callChatApi).not.toHaveBeenCalled();
    expect(generateLocalResponse).toHaveBeenCalled();
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

  it("should handle general errors gracefully", async () => {
    // Setup a mock that throws an unexpected error
    (callChatApi as jest.Mock).mockImplementation(() => {
      throw new Error("Unexpected error");
    });
    
    // Call function
    const result = await generateResponse(
      "Hello",
      [],
      false,
      jest.fn()
    );
    
    // Assertions
    expect(result.text).toContain("sorry");
    expect(result.isUser).toBe(false);
    expect(toast).toHaveBeenCalled();
  });
});
