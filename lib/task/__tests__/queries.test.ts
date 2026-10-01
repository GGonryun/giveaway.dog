import { describe, it, expect } from 'vitest';
import {
  ELIGIBLE_TASK_COMPLETION_INCLUDE_QUERY,
  SWEEPSTAKES_TASK_WHERE_QUERY
} from '../queries';

describe('ELIGIBLE_TASK_COMPLETION_INCLUDE_QUERY', () => {
  it('includes the task and the participant user with only the latest quality score', () => {
    expect(ELIGIBLE_TASK_COMPLETION_INCLUDE_QUERY).toEqual({
      participant: {
        include: {
          user: {
            include: {
              quality: {
                take: 1,
                orderBy: { createdAt: 'desc' }
              }
            }
          }
        }
      },
      task: true
    });
  });
});

describe('SWEEPSTAKES_TASK_WHERE_QUERY', () => {
  describe('when a sweepstakes id is provided', () => {
    it('filters by sweepstakes id only and ignores the team slug and user', () => {
      const where = SWEEPSTAKES_TASK_WHERE_QUERY({
        sweepstakesId: 'sweep-1',
        slug: 'acme',
        userId: 'user-1'
      });

      expect(where).toEqual({ sweepstakesId: 'sweep-1' });
    });
  });

  describe('when no sweepstakes id is provided', () => {
    it('scopes tasks to sweepstakes of the team the user is a member of', () => {
      const where = SWEEPSTAKES_TASK_WHERE_QUERY({
        slug: 'acme',
        userId: 'user-1'
      });

      expect(where).toEqual({
        sweepstakes: {
          team: {
            slug: 'acme',
            members: { some: { userId: 'user-1' } }
          }
        }
      });
    });

    it('treats an empty sweepstakes id as absent and falls back to team scoping', () => {
      const where = SWEEPSTAKES_TASK_WHERE_QUERY({
        sweepstakesId: '',
        slug: 'acme',
        userId: 'user-2'
      });

      expect(where).toEqual({
        sweepstakes: {
          team: {
            slug: 'acme',
            members: { some: { userId: 'user-2' } }
          }
        }
      });
    });
  });
});
