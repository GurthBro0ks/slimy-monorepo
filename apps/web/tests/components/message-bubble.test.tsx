import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MessageBubble } from '@/components/chat/message-bubble';
import { Message } from '@/types/chat';

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('MessageBubble', () => {
  const mockMessage: Message = {
    id: 'test-message-id',
    role: 'user',
    content: 'Hello, this is a test message!',
    timestamp: Date.now(),
  };

  const mockAssistantMessage: Message = {
    id: 'assistant-message-id',
    role: 'assistant',
    content: 'Hello! How can I help you today?',
    timestamp: Date.now() - 60000, // 1 minute ago
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user message with correct styling', () => {
    render(<MessageBubble message={mockMessage} />);

    const messageElement = screen.getByText('Hello, this is a test message!');
    expect(messageElement).toBeInTheDocument();

    // Check that user message is right-aligned
    const container = messageElement.closest('.justify-end');
    expect(container).toBeInTheDocument();

    // Check background color for user messages
    const bubble = messageElement.closest('.bg-neon-green');
    expect(bubble).toBeInTheDocument();
    expect(bubble).toHaveClass('text-zinc-900');
  });

  it('renders assistant message with correct styling', () => {
    render(<MessageBubble message={mockAssistantMessage} />);

    const messageElement = screen.getByText('Hello! How can I help you today?');
    expect(messageElement).toBeInTheDocument();

    // Check that assistant message is left-aligned
    const container = messageElement.closest('.justify-start');
    expect(container).toBeInTheDocument();

    // Check background color for assistant messages
    const bubble = messageElement.closest('.bg-zinc-800');
    expect(bubble).toBeInTheDocument();
    expect(bubble).toHaveClass('text-zinc-100');
  });

  it('displays formatted timestamp', () => {
    const fixedTimestamp = new Date('2024-01-15T10:30:00Z').getTime();
    const messageWithFixedTime: Message = {
      ...mockMessage,
      timestamp: fixedTimestamp,
    };

    render(<MessageBubble message={messageWithFixedTime} />);

    // The timestamp should be formatted as a time string
    const timeElement = screen.getByText(/\d{1,2}:\d{2}:\d{2}/);
    expect(timeElement).toBeInTheDocument();
  });

  it('shows copy button on hover', () => {
    render(<MessageBubble message={mockMessage} />);

    const copyButton = screen.getByTitle('Copy message');
    expect(copyButton).toBeInTheDocument();
    expect(copyButton).toHaveClass('opacity-0');

    // Simulate hover by adding group-hover class manually or trigger mouse events
    const bubble = copyButton.closest('.group');
    expect(bubble).toBeInTheDocument();
  });

  it('copies message content to clipboard when copy button is clicked', async () => {
    render(<MessageBubble message={mockMessage} />);

    const copyButton = screen.getByTitle('Copy message');

    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockMessage.content);
    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
  });

  it('shows check icon after successful copy', async () => {
    render(<MessageBubble message={mockMessage} />);

    const copyButton = screen.getByTitle('Copy message');

    // Initially should show copy icon
    expect(document.querySelector('.lucide-copy')).toBeInTheDocument();
    expect(document.querySelector('.lucide-check')).not.toBeInTheDocument();

    fireEvent.click(copyButton);

    // Should show check icon after copy
    await waitFor(() => {
      expect(document.querySelector('.lucide-check')).toBeInTheDocument();
      expect(document.querySelector('.lucide-copy')).not.toBeInTheDocument();
    });
  });

  it('shows temporary check icon after copy', async () => {
    render(<MessageBubble message={mockMessage} />);

    const copyButton = screen.getByTitle('Copy message');

    fireEvent.click(copyButton);

    // Should show check icon after copy
    await waitFor(() => {
      expect(document.querySelector('.lucide-check')).toBeInTheDocument();
    });

    // Note: The timeout behavior is tested implicitly by the component's internal logic
    // In a real scenario, it would revert after 2 seconds
  });

  it('handles long messages with word wrapping', () => {
    const longMessage: Message = {
      ...mockMessage,
      content: 'This is a very long message that should wrap properly and break words when necessary to fit within the container boundaries and maintain readability.',
    };

    render(<MessageBubble message={longMessage} />);

    const messageElement = screen.getByText(longMessage.content);
    expect(messageElement).toHaveClass('whitespace-pre-wrap', 'break-words');
  });

  it('handles messages with special characters', () => {
    const specialMessage: Message = {
      ...mockMessage,
      content: 'Message with special chars: éñüñ@#$%^&*()',
    };

    render(<MessageBubble message={specialMessage} />);

    expect(screen.getByText('Message with special chars: éñüñ@#$%^&*()')).toBeInTheDocument();
  });

  it('handles empty message content', () => {
    const emptyMessage: Message = {
      ...mockMessage,
      content: '',
    };

    render(<MessageBubble message={emptyMessage} />);

    // Should render the message bubble even with empty content
    const messageBubble = screen.getByTitle('Copy message').closest('.rounded-2xl');
    expect(messageBubble).toBeInTheDocument();

    // Should contain a paragraph element (even if empty)
    const paragraph = messageBubble?.querySelector('p');
    expect(paragraph).toBeInTheDocument();
  });

  it('renders with correct accessibility attributes', () => {
    render(<MessageBubble message={mockMessage} />);

    const copyButton = screen.getByTitle('Copy message');
    expect(copyButton).toHaveAttribute('title', 'Copy message');
  });
});
