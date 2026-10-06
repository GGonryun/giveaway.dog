import { describe, expect, it } from 'vitest';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { ApplicationError } from '@giveaway/util-errors';
import { findE2eSweepstakesId, findE2eTeam, isE2eOnlyTeam } from '../ownership';
import { e2eUser, realUser, teamRow } from './fixtures';

const db = asPrismaClient();

describe('isE2eOnlyTeam', () => {
  it('accepts an e2e team of e2e users', () => {
    expect(isE2eOnlyTeam(teamRow())).toBe(true);
  });

  it('accepts an e2e team with the shared e2e host', () => {
    expect(
      isE2eOnlyTeam(
        teamRow({
          members: [
            {
              role: 'OWNER',
              user: { ...e2eUser('host'), email: 'e2e-host@example.com' }
            }
          ]
        })
      )
    ).toBe(true);
  });

  it('refuses a team whose slug does not start with e2e-', () => {
    expect(isE2eOnlyTeam(teamRow({ slug: 'acme' }))).toBe(false);
  });

  it('refuses a team with a member who is not an e2e user', () => {
    expect(
      isE2eOnlyTeam(
        teamRow({
          members: [
            { role: 'OWNER', user: e2eUser('host') },
            { role: 'MEMBER', user: realUser() }
          ]
        })
      )
    ).toBe(false);
  });

  it('refuses a team with a member who has no email', () => {
    expect(
      isE2eOnlyTeam(
        teamRow({
          members: [
            {
              role: 'OWNER',
              user: { ...e2eUser('host'), email: null }
            }
          ]
        })
      )
    ).toBe(false);
  });
});

describe('findE2eTeam', () => {
  it('returns an e2e team', async () => {
    prismaMock.team.findUnique.mockResolvedValue(teamRow());

    await expect(findE2eTeam(db, 'e2e-abc123-w0')).resolves.toEqual(teamRow());
  });

  it('does not look up a slug outside e2e', async () => {
    await expect(findE2eTeam(db, 'acme')).rejects.toMatchObject({
      code: 'NOT_FOUND'
    });
    expect(prismaMock.team.findUnique).not.toHaveBeenCalled();
  });

  it('reports a missing team', async () => {
    prismaMock.team.findUnique.mockResolvedValue(null);

    await expect(findE2eTeam(db, 'e2e-abc123-w0')).rejects.toMatchObject({
      code: 'NOT_FOUND'
    });
  });

  it('refuses a team with a member who is not an e2e user', async () => {
    prismaMock.team.findUnique.mockResolvedValue(
      teamRow({ members: [{ role: 'OWNER', user: realUser() }] })
    );

    const error = await findE2eTeam(db, 'e2e-abc123-w0').catch(
      (e: unknown) => e
    );

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({ code: 'FORBIDDEN' });
  });
});

describe('findE2eSweepstakesId', () => {
  it('returns the id of a giveaway of an e2e team', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue({
      id: 'sw-1',
      team: teamRow()
    });

    await expect(findE2eSweepstakesId(db, 'sw-1')).resolves.toBe('sw-1');
  });

  it.each([
    ['a missing giveaway', null],
    ['a giveaway with no team', { id: 'sw-1', team: null }],
    [
      'a giveaway of another team',
      { id: 'sw-1', team: teamRow({ slug: 'acme' }) }
    ],
    [
      'a giveaway of a team with a real member',
      {
        id: 'sw-1',
        team: teamRow({ members: [{ role: 'OWNER', user: realUser() }] })
      }
    ]
  ])('hides %s', async (_, row) => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue(row);

    await expect(findE2eSweepstakesId(db, 'sw-1')).rejects.toMatchObject({
      code: 'NOT_FOUND'
    });
  });
});
