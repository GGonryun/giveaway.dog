import { render } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { withStableIds } from '@/components/sweepstakes/__tests__/fixtures';
import subscribeEmail from '@/procedures/marketing/subscribe-email';
import { SubscriptionCTA } from '../subscription-cta';

vi.mock('@/procedures/marketing/subscribe-email', () => ({
  default: vi.fn()
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('SubscriptionCTA', () => {
  beforeEach(() => {
    vi.mocked(subscribeEmail).mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it('matches the snapshot', () => {
    const { container } = render(<SubscriptionCTA />);
    expect(withStableIds(container)).toMatchSnapshot();
  });
});
