import { render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTeams } from '@/components/context/team-provider';
import { MockTeamProvider } from '../mock-team-provider';

describe('MockTeamProvider', () => {
  it('renders its children', () => {
    render(
      <MockTeamProvider>
        <p>Editor</p>
      </MockTeamProvider>
    );
    expect(screen.getByText('Editor')).toBeInTheDocument();
  });

  it('provides the demo team as the only team', () => {
    const { result } = renderHook(() => useTeams(), {
      wrapper: MockTeamProvider
    });
    expect(result.current.teams).toEqual([result.current.activeTeam]);
  });

  it('gives the demo team an owner role on the alpha tier', () => {
    const { result } = renderHook(() => useTeams(), {
      wrapper: MockTeamProvider
    });
    expect(result.current.activeTeam).toMatchObject({
      slug: 'demo-team',
      role: 'OWNER',
      tier: 'ALPHA'
    });
  });
});
