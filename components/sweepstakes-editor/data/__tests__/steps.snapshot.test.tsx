import { describe, expect, it } from 'vitest';
import { SWEEPSTAKE_STEP_LABELS, SWEEPSTAKE_STEP_ORDER } from '../steps';

describe('SWEEPSTAKE_STEP_ORDER', () => {
  it('has a label for every step', () => {
    expect(SWEEPSTAKE_STEP_ORDER.map((step) => SWEEPSTAKE_STEP_LABELS[step]))
      .toMatchInlineSnapshot(`
      [
        "Setup",
        "Audience",
        "Tasks",
        "Selection",
        "Prizes",
        "Design",
      ]
    `);
  });
});
