import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import subscribeEmail from '@/procedures/marketing/subscribe-email';
import { SubscriptionCTA } from '../subscription-cta';

vi.mock('@/procedures/marketing/subscribe-email', () => ({
  default: vi.fn()
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const emailInput = () => screen.getByPlaceholderText('Enter your email');
const subscribeButton = () =>
  screen.getByRole('button', { name: /Subscribe|Subscribing/ });

describe('SubscriptionCTA', () => {
  beforeEach(() => {
    vi.mocked(subscribeEmail).mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it('invites the visitor to subscribe', () => {
    render(<SubscriptionCTA />);
    expect(
      screen.getByRole('heading', { name: 'Never miss a giveaway!' })
    ).toBeInTheDocument();
    expect(emailInput()).toHaveAttribute('type', 'email');
  });

  it('disables subscribing until a valid email is entered', async () => {
    const user = userEvent.setup();
    render(<SubscriptionCTA />);
    expect(subscribeButton()).toBeDisabled();

    await user.type(emailInput(), 'jane@example');
    expect(subscribeButton()).toBeDisabled();

    await user.type(emailInput(), '.com');
    await waitFor(() => expect(subscribeButton()).toBeEnabled());
  });

  it('shows a validation message for an invalid email', async () => {
    const user = userEvent.setup();
    render(<SubscriptionCTA />);
    await user.type(emailInput(), 'not-an-email');
    expect(
      await screen.findByText('Please enter a valid email address')
    ).toBeInTheDocument();
  });

  it('rejects disposable email domains', async () => {
    const user = userEvent.setup();
    render(<SubscriptionCTA />);
    await user.type(emailInput(), 'jane@mailinator.com');
    expect(
      await screen.findByText('Please use a valid email address')
    ).toBeInTheDocument();
    expect(subscribeButton()).toBeDisabled();
  });

  it('subscribes the email and thanks the visitor', async () => {
    const user = userEvent.setup();
    vi.mocked(subscribeEmail).mockResolvedValue({
      ok: true,
      data: { success: true }
    });
    render(<SubscriptionCTA />);

    await user.type(emailInput(), 'jane@example.com');
    await user.click(subscribeButton());

    expect(
      await screen.findByRole('heading', { name: "You're all set!" })
    ).toBeInTheDocument();
    expect(vi.mocked(subscribeEmail).mock.calls[0][0]).toEqual({
      email: 'jane@example.com'
    });
    expect(toast.success).toHaveBeenCalledWith('Successfully subscribed!');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('shows the server message when subscribing fails', async () => {
    const user = userEvent.setup();
    vi.mocked(subscribeEmail).mockResolvedValue({
      ok: false,
      data: { code: 'CONFLICT', message: 'Already subscribed' }
    });
    render(<SubscriptionCTA />);

    await user.type(emailInput(), 'jane@example.com');
    await user.click(subscribeButton());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Already subscribed')
    );
    expect(emailInput()).toHaveValue('jane@example.com');
  });

  it('shows a loading label while subscribing', async () => {
    const user = userEvent.setup();
    vi.mocked(subscribeEmail).mockReturnValue(new Promise(() => {}));
    render(<SubscriptionCTA />);

    await user.type(emailInput(), 'jane@example.com');
    await user.click(subscribeButton());

    expect(
      await screen.findByRole('button', { name: 'Subscribing...' })
    ).toBeDisabled();
  });
});
