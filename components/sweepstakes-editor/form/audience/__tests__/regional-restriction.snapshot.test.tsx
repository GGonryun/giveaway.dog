import { describe, expect, it, vi } from 'vitest';
import { RegionalRestrictionSchema } from '@/schemas/giveaway/schemas';
import {
  buildFormValues,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { stabilizeIds } from '@/components/sweepstakes-editor/__tests__/stable-dom';
import { RegionalRestriction } from '../regional-restriction';

vi.mock('@/lib/countries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/countries')>();
  const regions = ['continent:EU', 'country:CA', 'country:JP'];
  return {
    ...actual,
    continentOptions: actual.continentOptions.filter((option) =>
      regions.includes(option.value)
    ),
    countryOptions: actual.countryOptions.filter((option) =>
      regions.includes(option.value)
    )
  };
});

const renderRestriction = (
  regionalRestriction: RegionalRestrictionSchema,
  validate = false
) => {
  const values = buildFormValues();
  return renderWithForm(
    (form) => (
      <RegionalRestriction
        form={form}
        fieldPath="audience.regionalRestriction"
      />
    ),
    {
      validate,
      values: {
        ...values,
        audience: { ...values.audience, regionalRestriction }
      }
    }
  );
};

describe('RegionalRestriction', () => {
  describe('when there is no restriction', () => {
    it('matches the snapshot', () => {
      const { container } = renderRestriction(null);
      expect(stabilizeIds(container)).toMatchSnapshot();
    });
  });

  describe('when there is a restriction', () => {
    const restriction = {
      regions: ['country:CA', 'continent:EU'],
      filter: 'EXCLUDE' as const
    };

    it('matches the snapshot', () => {
      const { container } = renderRestriction(restriction);
      expect(stabilizeIds(container)).toMatchSnapshot();
    });
  });
});
