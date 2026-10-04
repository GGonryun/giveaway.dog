import { describe, expect, it, vi } from 'vitest';
import {
  buildFormValues,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { stabilizeIds } from '@giveaway/testing-dom/stable-dom';
import { RegionalRestrictionRegions } from '../regional-restriction-regions';

vi.mock('@giveaway/util-geo/countries', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@giveaway/util-geo/countries')>();
  const regions = [
    'continent:AS',
    'continent:EU',
    'country:CA',
    'country:FR',
    'country:JP'
  ];
  return {
    ...actual,
    continentOptions: [
      ...actual.continentOptions.filter((option) =>
        regions.includes(option.value)
      ),
      { group: 'Continent', label: '', value: 'continent:XX' }
    ],
    countryOptions: [
      ...actual.countryOptions.filter((option) =>
        regions.includes(option.value)
      ),
      { group: 'Country', label: 'Nowhere', value: '' }
    ]
  };
});

const renderRegions = (regions: string[]) => {
  const values = buildFormValues();
  return renderWithForm(
    (form) => (
      <RegionalRestrictionRegions
        form={form}
        fieldPath="audience.regionalRestriction.regions"
      />
    ),
    {
      values: {
        ...values,
        audience: {
          ...values.audience,
          regionalRestriction: { regions, filter: 'INCLUDE' }
        }
      }
    }
  );
};

describe('RegionalRestrictionRegions', () => {
  it('matches the snapshot', () => {
    const { container } = renderRegions(['continent:EU', 'country:CA']);
    expect(stabilizeIds(container)).toMatchSnapshot();
  });
});
