import { describe, expect, it, vi } from 'vitest';
import type { FileUploadProps } from '@/components/ui/file-upload';
import {
  buildFormValues,
  LayoutValue,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { stabilizeIds } from '@/components/sweepstakes-editor/__tests__/stable-dom';
import { Setup } from '../setup';

vi.hoisted(() => {
  process.env.TZ = 'UTC';
});

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

vi.mock('@/components/ui/minimal-tiptap-editor', () => ({
  MinimalTiptap: ({
    content,
    onChange,
    placeholder
  }: {
    content?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
  }) => (
    <textarea
      aria-label={placeholder}
      value={content ?? ''}
      onChange={(event) => onChange?.(event.target.value)}
    />
  )
}));

vi.mock('@/components/ui/file-upload', () => ({
  FileUpload: ({ initialUrl, isDemo, onUpload }: FileUploadProps) => (
    <div role="group" aria-label="Banner upload">
      <span>{isDemo ? 'Demo uploads' : 'Live uploads'}</span>
      <span>{initialUrl ?? 'No banner'}</span>
      <button
        type="button"
        onClick={() => onUpload?.('https://cdn.test/banner.png')}
      >
        Upload banner
      </button>
      <button type="button" onClick={() => onUpload?.('')}>
        Remove banner
      </button>
    </div>
  )
}));

const renderSetup = (
  options: {
    validate?: boolean;
    layout?: Partial<LayoutValue>;
    banner?: string;
  } = {}
) => {
  const values = buildFormValues();
  return renderWithForm(<Setup />, {
    validate: options.validate,
    layout: options.layout,
    values: {
      ...values,
      setup: { ...values.setup, banner: options.banner ?? values.setup.banner },
      timing: { ...values.timing, timeZone: 'Asia/Tokyo' }
    }
  });
};

describe('Setup', () => {
  it('matches the snapshot', () => {
    const { container } = renderSetup({ banner: 'https://cdn.test/old.png' });
    expect(stabilizeIds(container)).toMatchSnapshot();
  });
});
