import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VisibilityType } from '@prisma/client';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import verifySlug from '@/procedures/sweepstakes/verify-slug';
import {
  buildFormValues,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { UrlSlugField, VisibilityTypeField } from '../sweepstakes-visibility';

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

type VerifySlugResult = Awaited<ReturnType<typeof verifySlug>>;

const mockedVerifySlug = vi.mocked(verifySlug);

const available = (value: boolean): VerifySlugResult => ({
  ok: true,
  data: { available: value }
});

const renderVisibility = (visibility: VisibilityType = 'UNLISTED') =>
  renderWithForm(
    (form) => (
      <VisibilityTypeField form={form} fieldPath="visibility.visibility" />
    ),
    { values: buildFormValues({ visibility: { visibility, slug: null } }) }
  );

const renderSlug = (slug: string | null) =>
  renderWithForm(
    (form) => <UrlSlugField form={form} fieldPath="visibility.slug" />,
    {
      values: buildFormValues({ visibility: { visibility: 'PUBLIC', slug } }),
      layout: { id: 'sweepstakes-1' }
    }
  );

describe('VisibilityTypeField', () => {
  it.each([
    ['PUBLIC', 'Public'],
    ['PRIVATE', 'Private'],
    ['UNLISTED', 'Unlisted']
  ] as const)('shows the %s visibility as %s', (visibility, label) => {
    renderVisibility(visibility);
    expect(screen.getByRole('combobox')).toHaveTextContent(label);
  });

  it('offers the public, private and unlisted visibilities', async () => {
    renderVisibility();
    await userEvent.click(screen.getByRole('combobox'));

    expect(
      screen.getAllByRole('option').map((option) => option.textContent)
    ).toEqual(['Public', 'Private', 'Unlisted']);
  });

  it('updates the form when another visibility is chosen', async () => {
    const { form } = renderVisibility('UNLISTED');
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Public' }));

    expect(form.getValues('visibility.visibility')).toBe('PUBLIC');
  });

  it('links to the browse page from the help dialog', async () => {
    const { container } = renderVisibility();
    const help = container.querySelector('[aria-haspopup="dialog"]');
    if (!help) throw new Error('Help trigger not found');
    await userEvent.click(help);

    const dialog = screen.getByRole('dialog', {
      name: 'Help: Visibility Type'
    });
    const links = within(dialog).getAllByRole('link', { name: 'browse' });
    expect(links).toHaveLength(3);
    links.forEach((link) => {
      expect(link).toHaveAttribute('href', '/browse');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });
});

describe('UrlSlugField', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockedVerifySlug.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const getSwitch = () =>
    screen.getByRole('switch', { name: 'Custom URL Slug' });

  const changeSlug = (slug: string) =>
    fireEvent.change(screen.getByRole('textbox'), { target: { value: slug } });

  const advance = (ms: number) =>
    act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });

  const hint =
    'Only letters, numbers, and hyphens. Must be unique across all giveaways.';

  describe('when there is no custom slug', () => {
    it('hides the slug input', () => {
      renderSlug(null);
      expect(getSwitch()).not.toBeChecked();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('starts from the sweepstakes id without checking it when turned on', async () => {
      const { form } = renderSlug(null);
      fireEvent.click(getSwitch());

      expect(form.getValues('visibility.slug')).toBe('sweepstakes-1');
      expect(screen.getByRole('textbox')).toHaveValue('sweepstakes-1');
      expect(screen.getByText(hint)).toBeInTheDocument();

      await advance(500);
      expect(mockedVerifySlug).not.toHaveBeenCalled();
    });
  });

  describe('when there is a custom slug', () => {
    it('removes the slug when turned off', () => {
      const { form } = renderSlug('summer-fun');
      fireEvent.click(getSwitch());

      expect(form.getValues('visibility.slug')).toBeNull();
      expect(getSwitch()).not.toBeChecked();
    });

    it('checks the slug once typing has paused for 500ms', async () => {
      mockedVerifySlug.mockResolvedValue(available(true));
      renderSlug(null);
      fireEvent.click(getSwitch());
      changeSlug('summer-fun');

      await advance(499);
      expect(mockedVerifySlug).not.toHaveBeenCalled();

      await advance(1);
      expect(mockedVerifySlug).toHaveBeenCalledTimes(1);
      expect(mockedVerifySlug).toHaveBeenCalledWith({
        slug: 'summer-fun',
        currentSweepstakesId: 'sweepstakes-1'
      });
    });

    it('shows a loading message while the slug is checked', async () => {
      mockedVerifySlug.mockReturnValue(new Promise(() => {}));
      renderSlug('summer-fun');
      await advance(500);

      expect(
        screen.getByText('Verifying slug availability...')
      ).toBeInTheDocument();
    });

    it('confirms an available slug', async () => {
      mockedVerifySlug.mockResolvedValue(available(true));
      renderSlug('summer-fun');
      await advance(500);

      expect(
        screen.getByText('The slug "summer-fun" is available')
      ).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'aria-invalid',
        'false'
      );
    });

    it('shows an error for a slug that is taken', async () => {
      mockedVerifySlug.mockResolvedValue(available(false));
      const { form } = renderSlug('summer-fun');
      await advance(500);

      expect(
        screen.getByText(
          'The slug "summer-fun" is already taken. Please choose another one.'
        )
      ).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'aria-invalid',
        'true'
      );
      expect(form.getFieldState('visibility.slug').error?.type).toBe('manual');
    });

    it('returns to the hint when the check fails', async () => {
      mockedVerifySlug.mockResolvedValue({
        ok: false,
        data: { code: 'INTERNAL_SERVER_ERROR', message: 'Database offline' }
      });
      renderSlug('summer-fun');
      await advance(500);

      expect(screen.getByText(hint)).toBeInTheDocument();
    });

    it('returns to the hint when the check throws', async () => {
      mockedVerifySlug.mockRejectedValue(new Error('Network down'));
      renderSlug('summer-fun');
      await advance(500);

      expect(
        screen.queryByText('Verifying slug availability...')
      ).not.toBeInTheDocument();
      expect(screen.getByText(hint)).toBeInTheDocument();
    });

    it.each([
      ['empty', ''],
      ['shorter than 3 characters', 'ab'],
      ['longer than 50 characters', 'a'.repeat(51)],
      ['equal to the sweepstakes id', 'sweepstakes-1']
    ])('does not check a slug that is %s', async (_, slug) => {
      renderSlug('summer-fun');
      changeSlug(slug);
      await advance(500);

      expect(mockedVerifySlug).not.toHaveBeenCalled();
    });

    it('only checks the last slug typed', async () => {
      mockedVerifySlug.mockResolvedValue(available(true));
      renderSlug('summer-fun');
      await advance(300);
      changeSlug('winter');
      await advance(300);
      changeSlug('winter-fun');
      await advance(500);

      expect(mockedVerifySlug).toHaveBeenCalledTimes(1);
      expect(mockedVerifySlug).toHaveBeenCalledWith({
        slug: 'winter-fun',
        currentSweepstakesId: 'sweepstakes-1'
      });
    });

    it('cancels a pending check when unmounted', async () => {
      const { unmount } = renderSlug('summer-fun');
      unmount();
      await advance(500);

      expect(mockedVerifySlug).not.toHaveBeenCalled();
    });
  });
});
