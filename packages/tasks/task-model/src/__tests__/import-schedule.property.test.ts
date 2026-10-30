import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { assertProperty } from '@giveaway/testing-server/property';
import {
  MAX_IMPORT_INTERVAL_MINUTES,
  toImportIntervalMinutes,
  toNextImportRunAt
} from '../import-schedule';

const MINUTE = 60 * 1000;
const baseMinutes = fc.integer({ min: 0, max: 5000 });
const idleRuns = fc.integer({ min: 0, max: 2000 });
const now = fc.date({
  min: new Date('2020-01-01T00:00:00.000Z'),
  max: new Date('2030-01-01T00:00:00.000Z'),
  noInvalidDate: true
});

describe('import schedule', () => {
  it('never waits longer than one day', () => {
    assertProperty(
      fc.property(baseMinutes, idleRuns, (base, idle) => {
        expect(
          toImportIntervalMinutes({ baseMinutes: base, idleRuns: idle })
        ).toBeLessThanOrEqual(MAX_IMPORT_INTERVAL_MINUTES);
      })
    );
  });

  it('never waits less after another scan with no new users', () => {
    assertProperty(
      fc.property(baseMinutes, idleRuns, (base, idle) => {
        expect(
          toImportIntervalMinutes({ baseMinutes: base, idleRuns: idle + 1 })
        ).toBeGreaterThanOrEqual(
          toImportIntervalMinutes({ baseMinutes: base, idleRuns: idle })
        );
      })
    );
  });

  it('schedules a run no later than the end date while the giveaway runs', () => {
    assertProperty(
      fc.property(
        now,
        baseMinutes,
        idleRuns,
        fc.integer({ min: 1, max: 60 * 24 * 365 }),
        (date, base, idle, minutesLeft) => {
          const endDate = new Date(date.getTime() + minutesLeft * MINUTE);
          const runAt = toNextImportRunAt({
            now: date,
            baseMinutes: base,
            idleRuns: idle,
            endDate
          });

          expect(runAt).not.toBeNull();
          expect(runAt!.getTime()).toBeLessThanOrEqual(endDate.getTime());
          expect(runAt!.getTime()).toBeGreaterThanOrEqual(date.getTime());
        }
      )
    );
  });
});
