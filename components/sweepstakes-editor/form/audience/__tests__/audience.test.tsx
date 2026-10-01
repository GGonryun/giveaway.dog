import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { nanoid } from 'nanoid';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildFormValues,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { stabilizeIds } from '@/components/sweepstakes-editor/__tests__/stable-dom';
import { Audience } from '../audience';

vi.mock('nanoid', () => ({ nanoid: vi.fn() }));

vi.mock('@/procedures/sweepstakes/verify-slug', () => ({ default: vi.fn() }));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

const renderAudience = () => {
  const values = buildFormValues();
  return renderWithForm(<Audience />, {
    values: {
      ...values,
      audience: {
        ...values.audience,
        formFields: [
          { id: 'field-1', type: 'USERNAME', label: 'Username', required: true }
        ]
      }
    },
    layout: { id: 'sweepstakes-1' }
  });
};

describe('Audience', () => {
  beforeEach(() => {
    vi.mocked(nanoid).mockReset().mockReturnValue('new-id');
  });

  it('matches the snapshot', () => {
    const { container } = renderAudience();
    expect(stabilizeIds(container)).toMatchSnapshot();
  });

  it('groups the settings into identity, user details, location and visibility', () => {
    renderAudience();
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    ).toEqual(['Identity', 'User Details', 'Location', 'Visibility']);
  });

  it('stores the pre-entry login setting on the audience', async () => {
    const { form } = renderAudience();
    await userEvent.click(
      screen.getByRole('switch', { name: 'Require Pre-Entry Login' })
    );
    expect(form.getValues('audience.requirePreEntryLogin')).toBe(true);
  });

  it('stores the regional restriction on the audience', async () => {
    const { form } = renderAudience();
    await userEvent.click(
      screen.getByRole('switch', { name: 'Regional Restrictions' })
    );
    expect(form.getValues('audience.regionalRestriction')).toEqual({
      regions: [],
      filter: 'INCLUDE'
    });
  });

  it('stores the custom slug on the visibility settings', async () => {
    const { form } = renderAudience();
    await userEvent.click(
      screen.getByRole('switch', { name: 'Custom URL Slug' })
    );
    expect(form.getValues('visibility.slug')).toBe('sweepstakes-1');
  });

  it('adds custom form fields to the audience', async () => {
    const { form } = renderAudience();
    await userEvent.click(
      screen.getByRole('button', { name: 'Add Custom Field' })
    );
    await userEvent.click(screen.getByRole('menuitem', { name: 'Email' }));

    expect(form.getValues('audience.formFields')).toEqual([
      { id: 'field-1', type: 'USERNAME', label: 'Username', required: true },
      { id: 'new-id', type: 'EMAIL', label: 'Email', placeholder: '' }
    ]);
  });

  it('adds the profile completion task to the tasks', async () => {
    const { form } = renderAudience();
    const box = screen
      .getByText('Reward Profile Completion')
      .closest('.border');
    if (!(box instanceof HTMLElement)) throw new Error('Setting not found');
    await userEvent.click(within(box).getByRole('switch'));

    expect(form.getValues('tasks').map((task) => task.type)).toEqual([
      'BONUS_COMPLETE_PROFILE',
      'BONUS_TASK'
    ]);
  });
});
