import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';

// Mock the API calls
jest.mock('@/services/api', () => ({
  userApi: {
    getInfo: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    sendEmail: jest.fn(),
  },
}));

// Test component to use the auth context
const TestComponent = () => {
  const { user, isLoading, login, logout, register, sendEmailCode } = useAuth();
  
  return (
    <div>
      <div data-testid="user-status">
        {isLoading ? 'loading' : user ? `logged in as ${user.email}` : 'not logged in'}
      </div>
      <button onClick={() => login('test@example.com', 'password')} data-testid="login-btn">
        Login
      </button>
      <button onClick={logout} data-testid="logout-btn">
        Logout
      </button>
      <button onClick={() => register('test@example.com', 'password', 'nickname', '123456')} data-testid="register-btn">
        Register
      </button>
      <button onClick={() => sendEmailCode('test@example.com')} data-testid="send-email-btn">
        Send Email
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  const mockGetInfo = api.userApi.getInfo as jest.Mock;
  const mockLogin = api.userApi.login as jest.Mock;
  const mockLogout = api.userApi.logout as jest.Mock;
  const mockRegister = api.userApi.register as jest.Mock;
  const mockSendEmail = api.userApi.sendEmail as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initially checks user status and sets loading state', async () => {
    mockGetInfo.mockResolvedValue({
      code: 0,
      data: { id: 1, email: 'test@example.com', nickname: 'Test User' },
      success: true,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initially should show loading
    expect(screen.getByTestId('user-status')).toHaveTextContent('loading');

    // After check completes, should show user
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('logged in as test@example.com');
    });
  });

  it('handles login correctly', async () => {
    mockGetInfo.mockResolvedValue({
      code: 0,
      success: true,
      data: null,
    });
    
    mockLogin.mockResolvedValue({
      code: 0,
      data: { id: 1, email: 'test@example.com', nickname: 'Test User' },
      success: true,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial check
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('not logged in');
    });

    // Perform login
    screen.getByTestId('login-btn').click();

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('logged in as test@example.com');
    });
  });

  it('handles logout correctly', async () => {
    mockGetInfo.mockResolvedValue({
      code: 0,
      data: { id: 1, email: 'test@example.com', nickname: 'Test User' },
      success: true,
    });
    
    mockLogout.mockResolvedValue({
      code: 0,
      success: true,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial check
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('logged in as test@example.com');
    });

    // Perform logout
    screen.getByTestId('logout-btn').click();

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('not logged in');
    });
  });

  it('handles registration correctly', async () => {
    mockGetInfo.mockResolvedValue({
      code: 0,
      success: true,
      data: null,
    });
    
    mockRegister.mockResolvedValue({
      code: 0,
      data: { id: 1, email: 'test@example.com', nickname: 'Test User' },
      success: true,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for initial check
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('not logged in');
    });

    // Perform registration
    screen.getByTestId('register-btn').click();

    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('logged in as test@example.com');
    });
  });

  it('handles email sending correctly', async () => {
    mockGetInfo.mockResolvedValue({
      code: 0,
      success: true,
      data: null,
    });
    
    mockSendEmail.mockResolvedValue({
      code: 0,
      data: { code: '123456' },
      success: true,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Perform send email
    screen.getByTestId('send-email-btn').click();

    // Should not affect user status
    await waitFor(() => {
      expect(screen.getByTestId('user-status')).toHaveTextContent('not logged in');
    });
  });
});