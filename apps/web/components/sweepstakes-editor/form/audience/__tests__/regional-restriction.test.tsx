import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RegionalRestrictionSchema } from '@giveaway/sweepstakes-model/schemas';
import {
  buildFormValues,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { RegionalRestriction } from '../regional-restriction';

vi.mock('@giveaway/util-geo/countries', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@giveaway/util-geo/countries')>();
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

const getSwitch = () =>
  screen.getByRole('switch', { name: 'Regional Restrictions' });

describe('RegionalRestriction', () => {
  describe('when there is no restriction', () => {
    it('shows the switch turned off and hides the restriction fields', () => {
      renderRestriction(null);
      expect(getSwitch()).not.toBeChecked();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('starts an empty include restriction when turned on', async () => {
      const { form } = renderRestriction(null);
      await userEvent.click(getSwitch());

      expect(form.getValues('audience.regionalRestriction')).toEqual({
        regions: [],
        filter: 'INCLUDE'
      });
      expect(getSwitch()).toBeChecked();
      expect(screen.getByRole('combobox')).toHaveTextContent('Include');
      expect(screen.getByText('Select options')).toBeInTheDocument();
    });

    it('treats an undefined restriction as turned off', () => {
      renderRestriction(undefined);
      expect(getSwitch()).not.toBeChecked();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });
  });

  describe('when there is a restriction', () => {
    const restriction = {
      regions: ['country:CA', 'continent:EU'],
      filter: 'EXCLUDE' as const
    };

    it('shows the filter and the selected regions', () => {
      renderRestriction(restriction);
      expect(getSwitch()).toBeChecked();
      expect(screen.getByRole('combobox')).toHaveTextContent('Exclude');
      expect(screen.getByText('Canada')).toBeInTheDocument();
      expect(screen.getByText('Europe')).toBeInTheDocument();
    });

    it('removes the restriction when turned off', async () => {
      const { form } = renderRestriction(restriction);
      await userEvent.click(getSwitch());

      expect(form.getValues('audience.regionalRestriction')).toBeNull();
      expect(getSwitch()).not.toBeChecked();
      await waitFor(() =>
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
      );
    });
  });

  describe('validation', () => {
    it('asks for at least one region after the restriction is turned on', async () => {
      const { container } = renderRestriction(null, true);
      await userEvent.click(getSwitch());

      await waitFor(() =>
        expect(
          container.querySelector('#sub-form-item-message')
        ).toHaveTextContent('Array must contain at least 1 element(s)')
      );
    });

    it('clears the region error once a region is selected', async () => {
      const { container } = renderRestriction(null, true);
      await userEvent.click(getSwitch());
      await userEvent.click(
        screen.getByRole('button', { name: /Select options/ })
      );
      fireEvent.change(screen.getByPlaceholderText('Search...'), {
        target: { value: 'Canada' }
      });
      await userEvent.click(screen.getByRole('option', { name: 'Canada' }));

      await waitFor(() =>
        expect(
          container.querySelector('#sub-form-item-message')
        ).not.toBeInTheDocument()
      );
    });
  });
});
