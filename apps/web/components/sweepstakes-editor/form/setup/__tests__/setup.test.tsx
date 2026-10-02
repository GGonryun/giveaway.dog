import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { FileUploadProps } from '@/components/ui/file-upload';
import {
  buildFormValues,
  LayoutValue,
  renderWithForm
} from '@/components/sweepstakes-editor/__tests__/form-harness';
import { Setup } from '../setup';

vi.hoisted(() => {
  process.env.TZ = 'UTC';
});

vi.mock('@/lib/time', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/time')>();
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
  it('introduces the setup step', () => {
    renderSetup();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Setup' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Choose the details of your giveaway')
    ).toBeInTheDocument();
  });

  describe('name', () => {
    it('shows and updates the sweepstakes name', async () => {
      const { form } = renderSetup();
      const name = screen.getByLabelText('Name');
      expect(name).toHaveValue('Summer Giveaway');

      await userEvent.clear(name);
      await userEvent.type(name, 'Winter Giveaway');
      expect(form.getValues('setup.name')).toBe('Winter Giveaway');
    });

    it('requires at least 3 characters', async () => {
      renderSetup({ validate: true });
      const name = screen.getByLabelText('Name');
      await userEvent.clear(name);
      await userEvent.type(name, 'ab');

      expect(
        await screen.findByText('String must contain at least 3 character(s)')
      ).toBeInTheDocument();
      expect(name).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('banner', () => {
    const getUpload = () =>
      screen.getByRole('group', { name: 'Banner upload' });

    it('passes the stored banner to the upload', () => {
      renderSetup({ banner: 'https://cdn.test/old.png' });
      expect(getUpload()).toHaveTextContent('https://cdn.test/old.png');
    });

    it('uses live uploads outside of the demo', () => {
      renderSetup({ layout: { action: 'edit' } });
      expect(getUpload()).toHaveTextContent('Live uploads');
    });

    it('uses demo uploads in the demo', () => {
      renderSetup({ layout: { action: 'demo' } });
      expect(getUpload()).toHaveTextContent('Demo uploads');
    });

    it('stores the uploaded banner', async () => {
      const { form } = renderSetup();
      await userEvent.click(
        within(getUpload()).getByRole('button', { name: 'Upload banner' })
      );
      expect(form.getValues('setup.banner')).toBe(
        'https://cdn.test/banner.png'
      );
    });

    it('stores null when the banner is removed', async () => {
      const { form } = renderSetup({ banner: 'https://cdn.test/old.png' });
      await userEvent.click(
        within(getUpload()).getByRole('button', { name: 'Remove banner' })
      );
      expect(form.getValues('setup.banner')).toBeNull();
    });

    it.fails(
      'accepts a form without a banner after the banner is removed',
      async () => {
        const { form } = renderSetup({
          banner: 'https://cdn.test/old.png',
          validate: true
        });
        await userEvent.click(
          within(getUpload()).getByRole('button', { name: 'Remove banner' })
        );
        expect(await form.trigger('setup.banner')).toBe(true);
      }
    );
  });

  describe('description', () => {
    it('edits the description in the rich text editor', async () => {
      const { form } = renderSetup();
      const editor = screen.getByRole('textbox', {
        name: 'Enter a description'
      });
      expect(editor).toHaveValue('<p>Win a summer prize</p>');

      await userEvent.clear(editor);
      await userEvent.type(editor, 'New description');
      expect(form.getValues('setup.description')).toBe('New description');
    });
  });

  describe('dates', () => {
    const getPicker = (label: string) => {
      const item = screen.getByText(label).parentElement;
      if (!item) throw new Error(`${label} not found`);
      return within(item).getByRole('button');
    };

    it('shows the start and end dates', () => {
      renderSetup();
      expect(getPicker('Start Date')).toHaveTextContent('Jul 1, 2026');
      expect(getPicker('End Date')).toHaveTextContent('Jul 15, 2026');
    });

    it.fails('labels the date pickers', () => {
      renderSetup();
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    });

    it('stores the picked start date', async () => {
      const { form } = renderSetup();
      await userEvent.click(getPicker('Start Date'));
      await userEvent.click(
        screen.getByRole('button', { name: /July 10th, 2026/ })
      );

      const startDate = form.getValues('timing.startDate');
      expect(startDate.toISOString()).toBe('2026-07-10T12:00:00.000Z');
    });
  });

  describe('time zone', () => {
    it('shows the stored time zone', () => {
      renderSetup();
      expect(screen.getByRole('combobox')).toHaveTextContent(
        '(GMT+09:00) Japan Time (Tokyo)'
      );
    });

    it('stores the chosen time zone', async () => {
      const { form } = renderSetup();
      await userEvent.click(screen.getByRole('combobox'));
      await userEvent.click(
        screen.getByRole('option', {
          name: '(GMT+00:00) Greenwich Mean Time (Reykjavík)'
        })
      );

      expect(form.getValues('timing.timeZone')).toBe('Atlantic/Reykjavik');
      expect(screen.getByRole('combobox')).toHaveTextContent(
        '(GMT+00:00) Greenwich Mean Time (Reykjavík)'
      );
    });
  });

  it('includes the terms and conditions', () => {
    renderSetup();
    expect(screen.getByText('Terms & Conditions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Modify' })).toBeInTheDocument();
  });
});
