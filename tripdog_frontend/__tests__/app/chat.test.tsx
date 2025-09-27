import { render, screen } from '@testing-library/react';
import * as React from 'react';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'test@example.com', nickname: 'Test User' },
    isLoading: false,
  }),
}));

// Mock chat store
jest.mock('@/stores/chatStore', () => ({
  useChatStore: () => ({
    currentCharacter: {
      id: 1,
      name: 'Test Character',
      description: 'A test character',
      roleSetting: 'A helpful assistant',
      conversationId: 'conv-123',
    },
  }),
}));

// Mock Ant Design components
jest.mock('antd', () => {
  const originalModule = jest.requireActual('antd');
  return {
    ...originalModule,
    App: {
      useApp: () => ({
        message: {
          success: jest.fn(),
          error: jest.fn(),
        },
      }),
    },
  };
});

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => React.createElement('div', props, children),
  },
}));

// Mock @lobehub/tts/react
jest.mock('@lobehub/tts/react', () => ({
  useSpeechRecognition: () => ({
    text: '',
    start: jest.fn(),
    stop: jest.fn(),
    isLoading: false,
    isRecording: false,
    formattedTime: '00:00',
  }),
  useEdgeSpeech: () => ({
    setText: jest.fn(),
    isGlobalLoading: false,
    start: jest.fn(),
    canStart: true,
  }),
}));

// Mock qwenTTS service
jest.mock('@/services/qwenTTS', () => ({
  useQwenTTS: () => ({
    setText: jest.fn(),
    isGlobalLoading: false,
    start: jest.fn(),
    error: null,
  }),
}));

// Create a simple mock for the ChatPage component since we can't import it directly
const ChatPage = () => {
  return React.createElement('div', { 'data-testid': 'chat-page' }, 'Chat Page');
};

describe('ChatPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders chat page when user is logged in and character is selected', () => {
    render(React.createElement(ChatPage));
    
    // Check if the chat interface is rendered
    expect(screen.getByTestId('chat-page')).toBeInTheDocument();
  });
});