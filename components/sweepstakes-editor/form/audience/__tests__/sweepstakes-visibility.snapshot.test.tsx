import { VisibilityType } from '@prisma/client';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import verifySlug from '@/procedures/sweepstakes/verify-slug';
import {
  buildFormValues,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { stabilizeIds } from '@/components/sweepstakes-editor/__tests__/stable-dom';
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

const mockedVerifySlug = vi.mocked(verifySlug);

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
  it('matches the snapshot', () => {
    const { container } = renderVisibility();
    expect(stabilizeIds(container)).toMatchSnapshot();
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

  describe('when there is no custom slug', () => {
    it('matches the snapshot', () => {
      const { container } = renderSlug(null);
      expect(stabilizeIds(container)).toMatchSnapshot();
    });
  });

  describe('when there is a custom slug', () => {
    it('matches the snapshot', () => {
      const { container } = renderSlug('summer-fun');
      expect(stabilizeIds(container)).toMatchSnapshot();
    });
  });
});
