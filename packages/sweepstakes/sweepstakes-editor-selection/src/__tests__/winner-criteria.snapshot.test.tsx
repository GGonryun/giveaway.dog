import { describe, expect, it } from 'vitest';
import { SweepstakesWinnerCriteriaSchema } from '@giveaway/sweepstakes-model/schemas';
import {
  buildFormValues,
  renderWithForm
} from '@giveaway/sweepstakes-editor-setup/testing/form-harness';
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
