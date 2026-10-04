import { render } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { withStableIds } from '@giveaway/sweepstakes-ui-testing/testing/fixtures';
import subscribeEmail from '@giveaway/marketing-server/subscribe-email';
import { SubscriptionCTA } from '../subscription-cta';

vi.mock('@giveaway/marketing-server/subscribe-email', () => ({
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
