import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TeamsProvider } from '@/components/context/team-provider';
import { EditGiveawayButton } from '../edit-giveaway-button';
import { buildTeam } from './fixtures';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() })
}));

const renderButton = (slug = 'acme') => {
  const team = buildTeam({ slug });
  return render(
    <TeamsProvider value={{ activeTeam: team, teams: [team] }}>
      <EditGiveawayButton id="sweep-1" />
    </TeamsProvider>
  );
};

describe('EditGiveawayButton', () => {
  it('matches the snapshot', () => {
    const { container } = renderButton();
    expect(container.firstChild).toMatchSnapshot();
  });

  it('links to the editor of the sweepstakes for the active team', () => {
    renderButton('globex');
    const link = screen.getByRole('link', { name: 'Edit' });
    expect(link).toHaveAttribute(
      'href',
      '/app/globex/sweepstakes/sweep-1/edit'
    );
    expect(link).toHaveAttribute('data-slot', 'button');
  });
});
