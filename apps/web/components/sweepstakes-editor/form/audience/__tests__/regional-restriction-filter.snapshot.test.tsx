import { RegionalRestrictionFilter } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import {
  buildFormValues,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { stabilizeIds } from '@/components/sweepstakes-editor/__tests__/stable-dom';
import { RegionalRestrictionFilterField } from '../regional-restriction-filter';

const renderFilter = (filter: RegionalRestrictionFilter) => {
  const values = buildFormValues();
  return renderWithForm(
    (form) => (
      <RegionalRestrictionFilterField
        form={form}
        fieldPath="audience.regionalRestriction.filter"
      />
    ),
    {
      values: {
        ...values,
        audience: {
          ...values.audience,
          regionalRestriction: { regions: ['country:US'], filter }
        }
      }
    }
  );
};

describe('RegionalRestrictionFilterField', () => {
  it('matches the snapshot', () => {
    const { container } = renderFilter('INCLUDE');
    expect(stabilizeIds(container)).toMatchSnapshot();
  });
});
