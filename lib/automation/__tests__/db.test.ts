import { describe, it, expect } from 'vitest';
import { SWEEPSTAKES_DISCORD_POST_SELECT_QUERY } from '../db';

describe('SWEEPSTAKES_DISCORD_POST_SELECT_QUERY', () => {
  it('selects the sweepstakes scalars and relations needed for a discord post', () => {
    expect(SWEEPSTAKES_DISCORD_POST_SELECT_QUERY).toMatchObject({
      id: true,
      tasks: true,
      visibility: true,
      teamId: true,
      details: true,
      timing: true,
      status: true,
      posts: true
    });
  });

  it('selects only the team name and logo', () => {
    expect(SWEEPSTAKES_DISCORD_POST_SELECT_QUERY.team).toEqual({
      select: { name: true, logo: true }
    });
  });

  it('selects prize draws down to the winning user id and name', () => {
    expect(SWEEPSTAKES_DISCORD_POST_SELECT_QUERY.prizes).toEqual({
      select: {
        name: true,
        quota: true,
        draws: {
          select: {
            result: true,
            taskCompletion: {
              select: {
                participant: {
                  select: {
                    user: { select: { id: true, name: true } }
                  }
                }
              }
            }
          }
        }
      }
    });
  });

  it('does not select any other top level fields', () => {
    expect(Object.keys(SWEEPSTAKES_DISCORD_POST_SELECT_QUERY).sort()).toEqual(
      [
        'details',
        'id',
        'posts',
        'prizes',
        'status',
        'tasks',
        'team',
        'teamId',
        'timing',
        'visibility'
      ].sort()
    );
  });
});
