import { render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamsProvider } from '@/components/context/team-provider';
import { createTemplate } from '@/lib/templates/procedures/create-template';
import { createSweepstakes } from '@/procedures/sweepstakes/create-sweepstakes';
import { CreateGiveawayButton } from '../create-giveaway-button';
import { buildTeam, withStableIds } from './fixtures';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), refresh: vi.fn() }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  useParams: () => ({ slug: 'acme' })
}));

vi.mock('@/procedures/sweepstakes/create-sweepstakes', () => ({
  createSweepstakes: vi.fn()
}));

vi.mock('@/lib/templates/procedures/create-template', () => ({
  createTemplate: vi.fn()
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const team = buildTeam();

const renderButton = (
  props: ComponentProps<typeof CreateGiveawayButton> = {}
) =>
  render(
    <TeamsProvider value={{ activeTeam: team, teams: [team] }}>
      <CreateGiveawayButton {...props} />
    </TeamsProvider>
  );

describe('CreateGiveawayButton', () => {
  beforeEach(() => {
    vi.mocked(createSweepstakes).mockReset();
    vi.mocked(createTemplate).mockReset();
    navigation.router.push.mockReset();
  });

  it('matches the snapshot', () => {
    const { container } = renderButton();
    expect(withStableIds(container)).toMatchSnapshot();
  });
});
