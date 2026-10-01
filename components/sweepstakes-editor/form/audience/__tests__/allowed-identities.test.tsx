import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { IdentityProviderSchema } from '@/lib/integrations/schemas/providers';
import {
  buildFormValues,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { stabilizeIds } from '@/components/sweepstakes-editor/__tests__/stable-dom';
import { AllowedIdentities } from '../allowed-identities';

const renderField = (
  allowedIdentities: IdentityProviderSchema[] = ['TWITTER', 'GOOGLE'],
  validate = false
) => {
  const values = buildFormValues();
  return renderWithForm(
    (form) => (
      <AllowedIdentities form={form} fieldPath="audience.allowedIdentities" />
    ),
    {
      validate,
      values: {
        ...values,
        audience: { ...values.audience, allowedIdentities }
      }
    }
  );
};

const getSelect = () =>
  screen.getByRole('button', { name: 'Allowed Identities' });

describe('AllowedIdentities', () => {
  it('matches the snapshot', () => {
    const { container } = renderField();
    expect(stabilizeIds(container)).toMatchSnapshot();
  });

  it('shows a badge for each allowed identity', () => {
    renderField(['TWITTER', 'DISCORD', 'EMAIL']);
    const select = getSelect();
    expect(within(select).getByText('X (Twitter)')).toBeInTheDocument();
    expect(within(select).getByText('Discord')).toBeInTheDocument();
    expect(within(select).getByText('Email')).toBeInTheDocument();
    expect(within(select).queryByText('Google')).not.toBeInTheDocument();
  });

  it('offers only the enabled identity providers', async () => {
    renderField();
    await userEvent.click(getSelect());

    const options = screen
      .getAllByRole('option')
      .map((option) => option.textContent);
    expect(options).toEqual([
      'X (Twitter)',
      'Bluesky',
      'Google',
      'Discord',
      'Steam',
      'Twitch',
      'Kick',
      'TikTok',
      'Instagram',
      'Facebook',
      'Anonymous',
      'Velora',
      'LinkedIn',
      'Email',
      'Clear',
      'Close'
    ]);
    expect(
      screen.queryByRole('option', { name: 'YouTube' })
    ).not.toBeInTheDocument();
  });

  it('adds an identity to the form when it is selected', async () => {
    const { form } = renderField(['TWITTER']);
    await userEvent.click(getSelect());
    await userEvent.click(screen.getByRole('option', { name: 'Bluesky' }));

    expect(form.getValues('audience.allowedIdentities')).toEqual([
      'TWITTER',
      'BLUESKY'
    ]);
  });

  it('removes an identity from the form when it is selected again', async () => {
    const { form } = renderField(['TWITTER', 'GOOGLE']);
    await userEvent.click(getSelect());
    await userEvent.click(screen.getByRole('option', { name: 'X (Twitter)' }));

    expect(form.getValues('audience.allowedIdentities')).toEqual(['GOOGLE']);
  });

  it('clears every identity from the clear action', async () => {
    const { form } = renderField(['TWITTER', 'GOOGLE']);
    await userEvent.click(getSelect());
    await userEvent.click(screen.getByRole('option', { name: 'Clear' }));

    expect(form.getValues('audience.allowedIdentities')).toEqual([]);
  });

  it('requires at least one identity', async () => {
    renderField(['TWITTER'], true);
    await userEvent.click(getSelect());
    await userEvent.click(screen.getByRole('option', { name: 'X (Twitter)' }));

    expect(
      await screen.findByText('At least one allowed identity is required')
    ).toBeInTheDocument();
    expect(getSelect()).toHaveAttribute('aria-invalid', 'true');
  });

  it('explains every allowed provider in the help dialog', async () => {
    const { container } = renderField();
    const help = container.querySelector('[aria-haspopup="dialog"]');
    if (!help) throw new Error('Help trigger not found');
    await userEvent.click(help);

    const dialog = screen.getByRole('dialog', {
      name: 'Help: Allowed Identities'
    });
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(14);
    expect(within(dialog).getByText('- LinkedIn')).toBeInTheDocument();
  });
});
