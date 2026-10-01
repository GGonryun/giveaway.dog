import { describe, it, expect } from 'vitest';
import {
  toActiveSweepstakeComponents,
  toExpiredSweepstakeComponents
} from '../util';
import { discordPostSweepstakes } from '../../__tests__/fixtures-discord-core';

describe('toActiveSweepstakeComponents', () => {
  describe('when a task id is provided', () => {
    it('returns a join button followed by a bonus entries link', () => {
      const result = toActiveSweepstakeComponents({
        taskId: 'task-9',
        sweepstakes: discordPostSweepstakes()
      });

      expect(result).toEqual([
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 3,
              label: 'Join Giveaway',
              custom_id: 'task:enter:task-9'
            },
            {
              type: 2,
              style: 5,
              label: 'Bonus Entries',
              url: 'https://giveaway.dog/browse/dog-treats'
            }
          ]
        }
      ]);
    });
  });

  describe('when no task id is provided', () => {
    it('returns only a view details link', () => {
      const result = toActiveSweepstakeComponents({
        sweepstakes: discordPostSweepstakes()
      });

      expect(result).toEqual([
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: 'View Details',
              url: 'https://giveaway.dog/browse/dog-treats'
            }
          ]
        }
      ]);
    });

    it('treats an empty task id as missing', () => {
      const result = toActiveSweepstakeComponents({
        taskId: '',
        sweepstakes: discordPostSweepstakes()
      });

      expect(result[0].components).toHaveLength(1);
      expect(result[0].components[0].label).toBe('View Details');
    });
  });

  it('links to the sweepstakes id when there is no visibility slug', () => {
    const result = toActiveSweepstakeComponents({
      sweepstakes: discordPostSweepstakes({ id: 'sweep-77', visibility: null })
    });

    expect(result[0].components[0].url).toBe(
      'https://giveaway.dog/browse/sweep-77'
    );
  });
});

describe('toExpiredSweepstakeComponents', () => {
  it('returns view details and browse giveaways links', () => {
    const result = toExpiredSweepstakeComponents({
      sweepstakes: discordPostSweepstakes()
    });

    expect(result).toEqual([
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: 'View Details',
            url: 'https://giveaway.dog/browse/dog-treats'
          },
          {
            type: 2,
            style: 5,
            label: 'Browse Giveaways',
            url: 'https://giveaway.dog/browse'
          }
        ]
      }
    ]);
  });

  it('ignores the task id', () => {
    const withTask = toExpiredSweepstakeComponents({
      taskId: 'task-1',
      sweepstakes: discordPostSweepstakes()
    });
    const withoutTask = toExpiredSweepstakeComponents({
      sweepstakes: discordPostSweepstakes()
    });

    expect(withTask).toEqual(withoutTask);
  });

  it('links to the sweepstakes id when there is no visibility slug', () => {
    const result = toExpiredSweepstakeComponents({
      sweepstakes: discordPostSweepstakes({ id: 'sweep-5', visibility: null })
    });

    expect(result[0].components[0].url).toBe(
      'https://giveaway.dog/browse/sweep-5'
    );
  });
});
