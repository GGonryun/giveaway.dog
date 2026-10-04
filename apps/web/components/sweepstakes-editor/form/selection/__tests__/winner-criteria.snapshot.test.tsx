import { describe, expect, it } from 'vitest';
import { SweepstakesWinnerCriteriaSchema } from '@/schemas/giveaway/schemas';
import {
  buildFormValues,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { stabilizeIds } from '@giveaway/testing-dom/stable-dom';
import { WinnerCriteria } from '../winner-criteria';

const renderCriteria = (
  criteria: Partial<SweepstakesWinnerCriteriaSchema> = {},
  validate = false
) => {
  const values = buildFormValues();
  return renderWithForm(<WinnerCriteria />, {
    values: { ...values, criteria: { ...values.criteria, ...criteria } },
    validate
  });
};

describe('WinnerCriteria', () => {
  it('matches the snapshot', () => {
    const { container } = renderCriteria();
    expect(stabilizeIds(container)).toMatchSnapshot();
  });
});
