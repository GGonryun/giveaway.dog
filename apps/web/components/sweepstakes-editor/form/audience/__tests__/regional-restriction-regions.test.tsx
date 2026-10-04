import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  buildFormValues,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
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

const openRegions = async () => {
  await userEvent.click(screen.getByRole('button'));
  return screen.getByRole('listbox');
};

const search = (text: string) =>
  fireEvent.change(screen.getByPlaceholderText('Search...'), {
    target: { value: text }
  });

describe('RegionalRestrictionRegions', () => {
  it('shows the placeholder when no region is selected', () => {
    renderRegions([]);
    expect(
      screen.getByRole('button', { name: 'Select options' })
    ).toBeInTheDocument();
  });

  it('shows the names of the selected continents and countries', () => {
    renderRegions(['continent:EU', 'country:CA']);
    const select = screen.getByRole('button');
    expect(within(select).getByText('Europe')).toBeInTheDocument();
    expect(within(select).getByText('Canada')).toBeInTheDocument();
  });

  it('offers the continents before the countries', async () => {
    renderRegions([]);
    const list = await openRegions();

    const continents = within(list).getByRole('group', { name: 'Continent' });
    const countries = within(list).getByRole('group', { name: 'Country' });
    expect(
      within(continents)
        .getAllByRole('option')
        .map((option) => option.textContent)
    ).toEqual(['Asia', 'Europe']);
    expect(
      within(countries)
        .getAllByRole('option')
        .map((option) => option.textContent)
    ).toEqual(['Canada', 'France', 'Japan']);
    expect(
      continents.compareDocumentPosition(countries) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('leaves out regions without a label or value', async () => {
    renderRegions([]);
    const list = await openRegions();
    expect(
      within(list)
        .getAllByRole('option')
        .map((option) => option.textContent)
    ).toEqual(['Asia', 'Europe', 'Canada', 'France', 'Japan', 'Close']);
    expect(within(list).queryByText('Nowhere')).not.toBeInTheDocument();
  });

  it('adds a searched country to the form', async () => {
    const { form } = renderRegions(['continent:EU']);
    await openRegions();
    search('Japan');
    await userEvent.click(screen.getByRole('option', { name: 'Japan' }));

    expect(form.getValues('audience.regionalRestriction.regions')).toEqual([
      'continent:EU',
      'country:JP'
    ]);
  });

  it('removes a region from the form when it is selected again', async () => {
    const { form } = renderRegions(['continent:EU', 'country:CA']);
    await openRegions();
    search('Europe');
    await userEvent.click(screen.getByRole('option', { name: 'Europe' }));

    expect(form.getValues('audience.regionalRestriction.regions')).toEqual([
      'country:CA'
    ]);
  });
});
