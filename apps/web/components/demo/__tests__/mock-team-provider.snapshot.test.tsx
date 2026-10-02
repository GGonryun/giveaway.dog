import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTeams } from '@/components/context/team-provider';
import { MockTeamProvider } from '../mock-team-provider';

describe('MockTeamProvider', () => {
  it('provides the demo team as the active team', () => {
    const { result } = renderHook(() => useTeams(), {
      wrapper: MockTeamProvider
    });
    expect(result.current.activeTeam).toMatchSnapshot();
  });
});
