
// This file is used to set up Jest testing

// Mock any browser APIs that might not be available in the test environment
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock the Web Speech API if needed for tests
if (typeof window !== 'undefined') {
  window.SpeechSynthesisUtterance = jest.fn().mockImplementation(() => {
    return {};
  });
  
  window.speechSynthesis = {
    speak: jest.fn(),
    cancel: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    getVoices: jest.fn().mockReturnValue([]),
    // Add the missing properties required by the SpeechSynthesis interface
    onvoiceschanged: null,
    paused: false,
    pending: false,
    speaking: false,
    // Add EventTarget methods that SpeechSynthesis inherits
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  };
}

export {};
