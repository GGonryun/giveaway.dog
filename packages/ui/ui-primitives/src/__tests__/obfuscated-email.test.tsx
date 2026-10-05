import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ObfuscatedEmail } from '../obfuscated-email';

describe('ObfuscatedEmail', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([null, undefined, ''])(
    'renders nothing when the email is %o',
    (email) => {
      const { container } = render(<ObfuscatedEmail email={email} />);
      expect(container).toBeEmptyDOMElement();
    }
  );

  it('masks the email by default', () => {
    render(<ObfuscatedEmail email="jane@example.com" />);
    expect(screen.getByText('j***e@example.com')).toBeInTheDocument();
    expect(screen.queryByText('jane@example.com')).not.toBeInTheDocument();
  });

  it('reveals and hides the email with the toggle button', async () => {
    render(<ObfuscatedEmail email="jane@example.com" />);

    await userEvent.click(screen.getByRole('button', { name: 'Reveal email' }));
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Hide email' }));
    expect(screen.getByText('j***e@example.com')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reveal email' })
    ).toBeInTheDocument();
  });

  it('masks the email again after ten seconds', () => {
    vi.useFakeTimers();
    render(<ObfuscatedEmail email="jane@example.com" />);

    fireEvent.click(screen.getByRole('button', { name: 'Reveal email' }));
    act(() => {
      vi.advanceTimersByTime(9999);
    });
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText('j***e@example.com')).toBeInTheDocument();
  });

  it('does not render the toggle when revealing is not allowed', () => {
    render(<ObfuscatedEmail email="jane@example.com" canReveal={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('j***e@example.com')).toBeInTheDocument();
  });

  it.each([
    ['xs', 'text-xs'],
    ['sm', 'text-sm'],
    ['md', 'text-md'],
    ['lg', 'text-lg']
  ] as const)('applies the %s text size', (size, className) => {
    render(<ObfuscatedEmail email="jane@example.com" size={size} />);
    expect(screen.getByText('j***e@example.com')).toHaveClass(className);
  });

  it('shows an empty label when the email has no domain', () => {
    const { container } = render(<ObfuscatedEmail email="not-an-email" />);
    expect(container.querySelector('span')).toBeEmptyDOMElement();
    expect(
      screen.getByRole('button', { name: 'Reveal email' })
    ).toBeInTheDocument();
  });

  it('merges a custom class name', () => {
    const { container } = render(
      <ObfuscatedEmail email="jane@example.com" className="justify-end" />
    );
    expect(container.firstChild).toHaveClass('justify-end', 'flex', 'gap-2');
  });
});
