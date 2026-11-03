import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SweepstakesWinnerCriteriaSchema } from '@giveaway/sweepstakes-model/schemas';
import {
  buildFormValues,
  renderWithForm
} from '@giveaway/sweepstakes-editor-setup/testing/form-harness';
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

    it('shows a readable message and an empty input when the input is cleared', async () => {
      renderCriteria({}, true);
      fireEvent.change(getInput(), { target: { value: '' } });

      expect(
        await screen.findByText('Minimum tasks must be at least 1')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Expected number, received nan')
      ).not.toBeInTheDocument();
      expect(getInput()).toHaveValue(null);
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

    it('selects the nearest level without changing a stored quality score between levels', () => {
      const { form } = renderCriteria({ minQualityScore: 60 });
      expect(form.getValues('criteria.minQualityScore')).toBe(60);
      expect(form.formState.isDirty).toBe(false);
      expect(screen.getByRole('radio', { name: 'Moderate' })).toBeChecked();
    });

    it('keeps a stored quality score between levels when the selected level is clicked again', async () => {
      const { form } = renderCriteria({ minQualityScore: 60 });
      await userEvent.click(screen.getByRole('radio', { name: 'Moderate' }));
      expect(form.getValues('criteria.minQualityScore')).toBe(60);
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

    it('describes multiple wins', () => {
      renderCriteria();
      expect(getSwitch()).toHaveAccessibleDescription(
        'Let the same participant win more than one prize.'
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
