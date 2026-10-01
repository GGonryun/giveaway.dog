import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import updateTeamLinks from '@/procedures/teams/update-team-links';
import { type SocialLink } from '@/schemas/social-links';
import { SocialLinksCard } from '../social-links-card';

vi.mock('@/procedures/teams/update-team-links', () => ({ default: vi.fn() }));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

expect.addSnapshotSerializer({
  test: (value) => typeof value === 'string' && /_r_[0-9a-z]+_/.test(value),
  serialize: (value: string) => `"${value.replace(/_r_[0-9a-z]+_/g, '_r_id_')}"`
});

const X_LINK: SocialLink[] = [{ platform: 'x', url: 'https://x.com/doggo' }];

const renderCard = (initialLinks: SocialLink[] = X_LINK) => {
  const onUpdate = vi.fn();
  const view = render(
    <SocialLinksCard
      slug="doggo-club"
      initialLinks={initialLinks}
      onUpdate={onUpdate}
    />
  );
  return { ...view, onUpdate };
};

describe('SocialLinksCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateTeamLinks).mockResolvedValue({
      ok: true,
      data: { success: true }
    });
  });

  it('matches the snapshot', () => {
    const { container } = renderCard();

    expect(container.firstChild).toMatchSnapshot();
  });
});
