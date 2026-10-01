import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SweepstakesWinnerCriteriaSchema } from '@/schemas/giveaway/schemas';
import {
  buildFormValues,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { stabilizeIds } from '@/components/sweepstakes-editor/__tests__/stable-dom';
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

  describe('minimum tasks completed', () => {
    const getInput = () => screen.getByLabelText('Minimum Tasks Completed');

    it('shows the stored minimum', () => {
      renderCriteria({ minTasksCompleted: 2 });
      expect(getInput()).toHaveValue(2);
      expect(getInput()).toHaveAttribute('min', '1');
    });

    it('stores the typed minimum as a number', () => {
      const { form } = renderCriteria();
      fireEvent.change(getInput(), { target: { value: '4' } });
      expect(form.getValues('criteria.minTasksCompleted')).toBe(4);
    });

    it('requires at least one task', async () => {
      renderCriteria({}, true);
      fireEvent.change(getInput(), { target: { value: '0' } });
      expect(
        await screen.findByText('Minimum tasks must be at least 1')
      ).toBeInTheDocument();
    });

    it('stores NaN when the input is cleared', async () => {
      const { form } = renderCriteria({}, true);
      fireEvent.change(getInput(), { target: { value: '' } });

      expect(form.getValues('criteria.minTasksCompleted')).toBeNaN();
      expect(
        await screen.findByText('Expected number, received nan')
      ).toBeInTheDocument();
    });
  });

  describe('bot enforcement', () => {
    it('selects the stored enforcement level', () => {
      renderCriteria({ minQualityScore: 25 });
      expect(screen.getByRole('radio', { name: 'Minimum' })).toBeChecked();
      expect(screen.getByRole('radio', { name: 'Moderate' })).not.toBeChecked();
    });

    it('stores the quality score of the chosen level', async () => {
      const { form } = renderCriteria({ minQualityScore: 50 });
      await userEvent.click(screen.getByRole('radio', { name: 'Maximum' }));

      expect(form.getValues('criteria.minQualityScore')).toBe(75);
      expect(screen.getByRole('radio', { name: 'Maximum' })).toBeChecked();
    });

    it('rounds a stored quality score to the nearest level', () => {
      const { form } = renderCriteria({ minQualityScore: 60 });
      expect(form.getValues('criteria.minQualityScore')).toBe(50);
      expect(screen.getByRole('radio', { name: 'Moderate' })).toBeChecked();
    });

    it('explains the quality signals in the help dialog', async () => {
      renderCriteria();
      const help = screen
        .getByText('Bot Enforcement')
        .parentElement?.querySelector('[aria-haspopup="dialog"]');
      if (!help) throw new Error('Help trigger not found');
      await userEvent.click(help);

      const dialog = screen.getByRole('dialog', { name: 'Bot Enforcement' });
      expect(dialog).toHaveTextContent('Quality Signals:');
      expect(dialog).toHaveTextContent('Risk Signals:');
    });
  });

  describe('multiple wins', () => {
    const getSwitch = () =>
      screen.getByRole('switch', { name: 'Allow Multiple Wins' });

    it('reflects the stored setting', () => {
      renderCriteria({ allowMultipleWins: true });
      expect(getSwitch()).toBeChecked();
    });

    it('updates the form when toggled', async () => {
      const { form } = renderCriteria({ allowMultipleWins: false });
      await userEvent.click(getSwitch());
      expect(form.getValues('criteria.allowMultipleWins')).toBe(true);
    });

    it('reuses the description of the require email setting', () => {
      renderCriteria();
      expect(getSwitch()).toHaveAccessibleDescription(
        'A valid email address is required to enter.'
      );
    });
  });

  describe('prize selection', () => {
    const getSwitch = () =>
      screen.getByRole('switch', { name: 'Allow Prize Selection' });

    it('reflects the stored setting', () => {
      renderCriteria({ allowUserSelection: false });
      expect(getSwitch()).not.toBeChecked();
    });

    it('updates the form when toggled', async () => {
      const { form } = renderCriteria({ allowUserSelection: false });
      await userEvent.click(getSwitch());
      expect(form.getValues('criteria.allowUserSelection')).toBe(true);
    });
  });
});
