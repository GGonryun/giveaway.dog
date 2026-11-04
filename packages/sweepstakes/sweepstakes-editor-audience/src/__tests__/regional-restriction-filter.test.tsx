import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegionalRestrictionFilter } from '@giveaway/db-model';
import { describe, expect, it } from 'vitest';
import {
  buildFormValues,
  renderWithForm
} from '@giveaway/sweepstakes-editor-setup/testing/form-harness';
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
  it.each([
    ['INCLUDE', 'Include'],
    ['EXCLUDE', 'Exclude']
  ] as const)('shows the %s filter as %s', (filter, label) => {
    renderFilter(filter);
    expect(screen.getByRole('combobox')).toHaveTextContent(label);
  });

  it('offers the include and exclude filters', async () => {
    renderFilter('INCLUDE');
    await userEvent.click(screen.getByRole('combobox'));

    expect(
      screen.getAllByRole('option').map((option) => option.textContent)
    ).toEqual(['Include', 'Exclude']);
  });

  it('updates the form when another filter is chosen', async () => {
    const { form } = renderFilter('INCLUDE');
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Exclude' }));

    expect(form.getValues('audience.regionalRestriction.filter')).toBe(
      'EXCLUDE'
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('Exclude');
  });

  it('marks the combobox invalid and describes it with the error', async () => {
    const { form } = renderFilter('INCLUDE');
    const combobox = screen.getByRole('combobox', { name: 'Region filter' });
    expect(combobox).toHaveAttribute('id');
    expect(combobox).toHaveAttribute('aria-invalid', 'false');

    await act(async () => {
      form.setError('audience.regionalRestriction.filter', {
        message: 'Pick a filter'
      });
    });

    expect(combobox).toHaveAttribute('aria-invalid', 'true');
    expect(combobox).toHaveAccessibleDescription('Pick a filter');
  });
});
