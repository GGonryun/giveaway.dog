import { screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { UnifiedFormAction } from '@giveaway/ui-layouts/form-layout/types';
import { SweepstakeFormContent } from '../sweepstake-form-content';
import { renderWithForm } from '@giveaway/sweepstakes-editor-setup/testing/form-harness';

vi.mock('@giveaway/task-editor/entry-methods/entry-methods', () => ({
  EntryMethods: ({
    fieldPath,
    action
  }: {
    fieldPath: string;
    action: UnifiedFormAction;
  }) => (
    <section aria-label="Entry methods">
      {fieldPath} in {action} mode
    </section>
  )
}));

vi.mock('@giveaway/util-time/time', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@giveaway/util-time/time')>();
  const zones = ['Pacific/Honolulu', 'Atlantic/Reykjavik', 'Asia/Tokyo'];
  return {
    ...actual,
    timezone: {
      ...actual.timezone,
      options: actual.timezone.options.filter((option) =>
        zones.includes(option.zone)
      )
    }
  };
});

vi.mock('@giveaway/ui-rich-text/minimal-tiptap-editor', () => ({
  MinimalTiptap: ({ placeholder }: { placeholder?: string }) => (
    <textarea aria-label={placeholder} />
  )
}));

vi.mock('@giveaway/ui-file-upload/file-upload', () => ({
  FileUpload: () => <div>Banner upload</div>
}));

vi.mock('@giveaway/sweepstakes-editor-server/verify-slug', () => ({
  default: vi.fn()
}));

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

const renderStep = (
  currentStep: string,
  action: UnifiedFormAction = 'create'
) =>
  renderWithForm(<SweepstakeFormContent />, {
    layout: { currentStep, action }
  });

const getSectionHeadings = () =>
  screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);

describe('SweepstakeFormContent', () => {
  it.each([
    ['setup', ['Setup']],
    ['audience', ['Identity', 'User Details', 'Location', 'Visibility']],
    ['selection', ['Winner Selection Criteria']],
    ['prizes', ['Prizes']],
    ['design', ['Form Design', 'Layout']]
  ])('shows only the %s step', (step, headings) => {
    renderStep(step);
    expect(getSectionHeadings()).toEqual(headings);
    expect(
      screen.queryByRole('region', { name: 'Entry methods' })
    ).not.toBeInTheDocument();
  });

  it.each(['create', 'edit', 'demo'] as const)(
    'shows the entry methods on the tasks step in %s mode',
    (action) => {
      renderStep('tasks', action);
      expect(
        screen.getByRole('region', { name: 'Entry methods' })
      ).toHaveTextContent(`tasks in ${action} mode`);
      expect(
        screen.queryByRole('heading', { level: 2 })
      ).not.toBeInTheDocument();
    }
  );

  it('renders nothing for an unknown step', () => {
    const { container } = renderStep('summary');
    expect(container).toBeEmptyDOMElement();
  });
});
