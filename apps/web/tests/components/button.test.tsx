import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border', 'border-input');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-secondary');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('hover:bg-accent');

    rerender(<Button variant="link">Link</Button>);
    expect(screen.getByRole('button')).toHaveClass('underline-offset-4');

    rerender(<Button variant="neon">Neon</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-neon-green', 'font-bold');

    rerender(<Button variant="purple">Purple</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-purple', 'font-bold');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-9', 'px-3');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-11', 'px-8');

    rerender(<Button size="icon">Icon</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10', 'w-10');
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('supports disabled state', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button disabled onClick={handleClick}>Disabled</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');

    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('forwards additional props to button element', () => {
    render(<Button type="submit" data-testid="custom-button">Submit</Button>);

    const button = screen.getByTestId('custom-button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('supports asChild prop with Slot', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/test');
    expect(link).toHaveClass('bg-primary'); // Button classes should be applied
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
    expect(button).toHaveClass('bg-primary'); // Default variant classes should still be applied
  });

  it('handles loading state through disabled prop', () => {
    render(<Button disabled>Loading...</Button>);

    const button = screen.getByRole('button', { name: /loading/i });
    expect(button).toBeDisabled();
  });
});
