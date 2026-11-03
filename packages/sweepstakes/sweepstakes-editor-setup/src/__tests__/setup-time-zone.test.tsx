import { act, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { buildFormValues, renderWithForm } from '../testing/form-harness';
import { Setup } from '../setup';

vi.hoisted(() => {
  process.env.TZ = 'UTC';
});

vi.mock('@giveaway/ui-rich-text/minimal-tiptap-editor', () => ({
  MinimalTiptap: () => null
}));

vi.mock('@giveaway/ui-file-upload/file-upload', () => ({
  FileUpload: () => null
}));

vi.mock('@giveaway/ui-date/date-time-picker', () => ({
  DateTimePicker: () => null
}));

const renderSetup = (timeZone: string) => {
  const values = buildFormValues();
  return renderWithForm(<Setup />, {
    values: { ...values, timing: { ...values.timing, timeZone } }
  });
};

const timeZoneSelect = () => screen.getByRole('combobox', { name: 'Timezone' });

describe('Setup time zone with every time zone', () => {
  it.each([
    ['UTC', '(GMT+00:00) Coordinated Universal Time (UTC)'],
    ['Etc/UTC', '(GMT+00:00) Coordinated Universal Time (UTC)'],
    ['Asia/Calcutta', '(GMT+05:30) India Time (Mumbai)'],
    ['Asia/Kolkata', '(GMT+05:30) India Time (Mumbai)'],
    ['Europe/Kiev', 'Kyiv']
  ])('shows the stored time zone %s', (timeZone, label) => {
    renderSetup(timeZone);

    expect(timeZoneSelect()).toHaveTextContent(label);
  });

  it('keeps the stored time zone in the form', () => {
    const { form } = renderSetup('Asia/Calcutta');

    expect(form.getValues('timing.timeZone')).toBe('Asia/Calcutta');
  });

  it('follows the form value when it changes after mount', () => {
    const { form } = renderSetup('UTC');

    act(() => {
      form.setValue('timing.timeZone', 'Asia/Calcutta');
    });

    expect(timeZoneSelect()).toHaveTextContent(
      '(GMT+05:30) India Time (Mumbai)'
    );
  });
});
