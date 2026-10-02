import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import updateTeamName from '@/procedures/teams/update-team-name';
import { TeamNameCard } from '../team-name-card';

vi.mock('@/procedures/teams/update-team-name', () => ({ default: vi.fn() }));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

const renderCard = (onUpdate = vi.fn()) => {
  const view = render(
    <TeamNameCard
      slug="doggo-club"
      initialName="Doggo Club"
      onUpdate={onUpdate}
    />
  );
  return { ...view, onUpdate };
};

describe('TeamNameCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateTeamName).mockResolvedValue({
      ok: true,
      data: { success: true }
    });
  });

  it('matches the snapshot', () => {
    const { container } = renderCard();

    expect(container.firstChild).toMatchSnapshot();
  });
});
