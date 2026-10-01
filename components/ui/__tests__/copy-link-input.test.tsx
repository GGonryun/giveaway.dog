import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CopyLinkInput } from '../copy-link-input';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

const link = 'https://giveaway.dog/g/summer-bike';

function getCopyButton() {
  return screen.getByRole('button');
}

describe('CopyLinkInput', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows the link in a read-only text box', () => {
    render(<CopyLinkInput value={link} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue(link);
    expect(input).toHaveAttribute('readonly');
  });

  it('shows the default placeholder and disables copying without a link', () => {
    render(<CopyLinkInput value="" />);
    expect(screen.getByPlaceholderText('URL')).toHaveValue('');
    expect(getCopyButton()).toBeDisabled();
  });

  it('uses a custom placeholder', () => {
    render(<CopyLinkInput value="" placeholder="Your referral link" />);
    expect(
      screen.getByPlaceholderText('Your referral link')
    ).toBeInTheDocument();
  });

  it('copies the link, confirms it and calls onCopy', async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    render(<CopyLinkInput value={link} onCopy={onCopy} />);

    await user.click(getCopyButton());

    await expect(navigator.clipboard.readText()).resolves.toBe(link);
    expect(toast.success).toHaveBeenCalledWith('Link copied to clipboard!');
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('shows a check mark for two seconds after copying', async () => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) }
    });
    render(<CopyLinkInput value={link} />);
    expect(
      getCopyButton().querySelector('.text-green-600')
    ).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(getCopyButton());
    });
    expect(
      getCopyButton().querySelector('.text-green-600')
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(
      getCopyButton().querySelector('.text-green-600')
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(
      getCopyButton().querySelector('.text-green-600')
    ).not.toBeInTheDocument();
  });

  it('reports a failure and skips onCopy when the clipboard rejects', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(
      new Error('denied')
    );
    const onCopy = vi.fn();
    render(<CopyLinkInput value={link} onCopy={onCopy} />);

    await user.click(getCopyButton());

    expect(toast.error).toHaveBeenCalledWith('Failed to copy link');
    expect(toast.success).not.toHaveBeenCalled();
    expect(onCopy).not.toHaveBeenCalled();
    expect(
      getCopyButton().querySelector('.text-green-600')
    ).not.toBeInTheDocument();
  });

  it('merges a custom class name on the wrapper', () => {
    const { container } = render(
      <CopyLinkInput value={link} className="max-w-md" />
    );
    expect(container.firstChild).toHaveClass('relative', 'flex', 'max-w-md');
  });
});
