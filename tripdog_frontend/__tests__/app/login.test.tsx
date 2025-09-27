import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPage from '@/app/(routes)/login/page';
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
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
        },
      }),
    },
  };
});

// Mock Ant Design icons
jest.mock('@ant-design/icons', () => ({
  MailOutlined: () => <div data-testid="mail-icon" />,
  LockOutlined: () => <div data-testid="lock-icon" />,
}));

describe('LoginPage', () => {
  const mockPush = jest.fn();
  const mockLogin = jest.fn();
  const mockUseAuth = useAuth as jest.Mock;
  const mockUseRouter = useRouter as jest.Mock;

  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
    });

    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      user: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(<LoginPage />);
    
    expect(screen.getByText('欢迎回来')).toBeInTheDocument();
    expect(screen.getByText('登录您的账户以继续')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('邮箱地址')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('密码')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();
  });

  it('shows error message when login fails', async () => {
    mockLogin.mockResolvedValue({
      success: false,
      message: '登录失败',
    });

    render(<LoginPage />);
    
    fireEvent.change(screen.getByPlaceholderText('邮箱地址'), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByPlaceholderText('密码'), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: '登录' }));
    
    await waitFor(() => {
      expect(screen.getByText('登录失败')).toBeInTheDocument();
    });
  });

  it('redirects to chat page when login succeeds', async () => {
    mockLogin.mockResolvedValue({
      success: true,
      message: '登录成功',
    });

    render(<LoginPage />);
    
    fireEvent.change(screen.getByPlaceholderText('邮箱地址'), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByPlaceholderText('密码'), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: '登录' }));
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/chat');
    });
  });

  it('redirects to chat page if user is already logged in', () => {
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      user: { id: 1, email: 'test@example.com', nickname: 'Test User' },
    });

    render(<LoginPage />);
    
    expect(mockPush).toHaveBeenCalledWith('/chat');
  });

  it('shows loading spinner when user is logged in and page is loading', () => {
    mockUseAuth.mockReturnValue({
      login: mockLogin,
      isLoading: true,
      user: { id: 1, email: 'test@example.com', nickname: 'Test User' },
    });

    render(<LoginPage />);
    
    expect(screen.getByRole('status')).toBeInTheDocument(); // Spin component
  });
});