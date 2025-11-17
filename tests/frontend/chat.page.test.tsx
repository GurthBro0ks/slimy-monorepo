/**
 * Frontend Component Test - Chat Page
 * Tests the chat page component rendering and interaction
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/chat',
}));

// Mock the chat interface component
vi.mock('../../apps/web/components/lazy', () => ({
  LazyChatInterface: () => (
    <div data-testid="chat-interface">
      <input
        data-testid="message-input"
        type="text"
        placeholder="Type a message..."
      />
      <button data-testid="send-btn">Send</button>
      <div data-testid="messages-container"></div>
    </div>
  ),
}));

vi.mock('../../apps/web/lib/lazy', () => ({
  LoadingSpinner: ({ size }: { size?: string }) => (
    <div data-testid="loading-spinner" data-size={size}>
      Loading...
    </div>
  ),
}));

// Import the page component
const ChatPage = require('../../apps/web/app/chat/page').default;

describe('Chat Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the chat page with title and description', () => {
    render(<ChatPage />);

    expect(screen.getByText('Slime Chat')).toBeInTheDocument();
    expect(
      screen.getByText('AI-powered conversations with personality modes')
    ).toBeInTheDocument();
  });

  it('should render the chat interface', async () => {
    render(<ChatPage />);

    // Wait for suspense to resolve
    await waitFor(() => {
      expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
    });

    expect(screen.getByTestId('message-input')).toBeInTheDocument();
    expect(screen.getByTestId('send-btn')).toBeInTheDocument();
  });

  it('should have message input and send button', async () => {
    render(<ChatPage />);

    await waitFor(() => {
      expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
    });

    const input = screen.getByTestId('message-input');
    const sendBtn = screen.getByTestId('send-btn');

    expect(input).toBeInTheDocument();
    expect(sendBtn).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('should allow typing in the message input', async () => {
    const user = userEvent.setup();
    render(<ChatPage />);

    await waitFor(() => {
      expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
    });

    const input = screen.getByTestId('message-input') as HTMLInputElement;
    await user.type(input, 'Hello, Slime!');

    expect(input.value).toBe('Hello, Slime!');
  });

  it('should render the MessageSquare icon', () => {
    const { container } = render(<ChatPage />);

    // Check for the icon class or SVG
    const iconContainer = container.querySelector('.text-neon-green');
    expect(iconContainer).toBeInTheDocument();
  });
});
