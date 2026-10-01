import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  buildFormValues,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { stabilizeIds } from '@/components/sweepstakes-editor/__tests__/stable-dom';
import { RequirePreEntryLogin } from '../require-pre-entry-login';

const renderField = (requirePreEntryLogin: boolean) => {
  const values = buildFormValues();
  return renderWithForm(
    (form) => (
      <RequirePreEntryLogin
        form={form}
        fieldPath="audience.requirePreEntryLogin"
      />
    ),
    {
      values: {
        ...values,
        audience: { ...values.audience, requirePreEntryLogin }
      }
    }
  );
};

const getSwitch = () =>
  screen.getByRole('switch', { name: 'Require Pre-Entry Login' });

describe('RequirePreEntryLogin', () => {
  it('matches the snapshot', () => {
    const { container } = renderField(false);
    expect(stabilizeIds(container)).toMatchSnapshot();
  });

  it('describes the setting', () => {
    renderField(false);
    expect(getSwitch()).toHaveAccessibleDescription(
      'Users must be logged in before viewing the giveaway.'
    );
  });

  it.each([true, false])('reflects a stored value of %s', (value) => {
    renderField(value);
    expect(getSwitch()).toHaveAttribute('aria-checked', String(value));
  });

  it('updates the form when toggled', async () => {
    const { form } = renderField(false);

    await userEvent.click(getSwitch());
    expect(form.getValues('audience.requirePreEntryLogin')).toBe(true);
    expect(getSwitch()).toBeChecked();

    await userEvent.click(getSwitch());
    expect(form.getValues('audience.requirePreEntryLogin')).toBe(false);
    expect(getSwitch()).not.toBeChecked();
  });

  it('opens the help dialog', async () => {
    const { container } = renderField(false);
    const help = container.querySelector('[aria-haspopup="dialog"]');
    if (!help) throw new Error('Help trigger not found');
    await userEvent.click(help);

    expect(
      screen.getByRole('dialog', { name: 'Help: Require Pre-Entry Login' })
    ).toHaveTextContent(
      'When enabled, users must be logged in to view the giveaway details and entry form.'
    );
  });
});
