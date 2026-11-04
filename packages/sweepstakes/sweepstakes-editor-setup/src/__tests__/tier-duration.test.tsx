import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TeamTier } from '@giveaway/db-model';
import type { DateTimePickerProps } from '@giveaway/ui-date/date-time-picker';
import { buildFormValues, renderWithForm } from '../testing/form-harness';
import { Setup } from '../setup';

vi.mock('@giveaway/ui-rich-text/minimal-tiptap-editor', () => ({
  MinimalTiptap: () => <textarea aria-label="Description" />
}));

vi.mock('@giveaway/ui-file-upload/file-upload', () => ({
  FileUpload: () => <div role="group" aria-label="Banner upload" />
}));

vi.mock('@giveaway/ui-date/date-time-picker', () => ({
  DateTimePicker: ({ value, onChange }: DateTimePickerProps) => (
    <div role="group" aria-label="Date picker">
      <span>{value?.toISOString() ?? 'No date'}</span>
      <button
        type="button"
        onClick={() => onChange?.(new Date('2026-07-20T12:00:00.000Z'))}
      >
        Pick July 20
      </button>
    </div>
  )
}));

const START = new Date('2026-07-01T12:00:00.000Z');

const renderSetup = (tier: TeamTier | undefined, endDate: Date) => {
  const values = buildFormValues();
  return renderWithForm(<Setup tier={tier} />, {
    values: {
      ...values,
      timing: { ...values.timing, startDate: START, endDate }
    }
  });
};

const upgrade = () =>
  screen.queryByRole('link', { name: 'Upgrade to run a longer giveaway' });

describe('the duration limit of the team tier in the editor', () => {
  it('[TIER-006] shows the limit of a Free team and no upgrade while the giveaway fits it', () => {
    renderSetup(TeamTier.FREE, new Date('2026-07-08T12:00:00.000Z'));

    expect(
      screen.getByText('A giveaway of a Free team runs for at most 7 days.')
    ).toBeInTheDocument();
    expect(upgrade()).not.toBeInTheDocument();
  });

  it('[TIER-006] offers an upgrade when the host picks an end date past the limit', async () => {
    renderSetup(TeamTier.FREE, new Date('2026-07-08T12:00:00.000Z'));

    const [, end] = screen.getAllByRole('button', { name: 'Pick July 20' });
    await userEvent.click(end);

    expect(upgrade()).toHaveAttribute('href', '/pricing');
  });

  it('[TIER-006] shows the limit of a Pro team and offers an upgrade past it', () => {
    renderSetup(TeamTier.PRO, new Date('2026-08-15T12:00:00.000Z'));

    expect(
      screen.getByText('A giveaway of a Pro team runs for at most 30 days.')
    ).toBeInTheDocument();
    expect(upgrade()).toHaveAttribute('href', '/pricing');
  });

  it('does not offer an upgrade to a team on the highest limit', () => {
    renderSetup(TeamTier.ALPHA, new Date('2026-12-01T12:00:00.000Z'));

    expect(
      screen.getByText('A giveaway of an Alpha team runs for at most 90 days.')
    ).toBeInTheDocument();
    expect(upgrade()).not.toBeInTheDocument();
  });

  it('shows no limit without a team tier', () => {
    renderSetup(undefined, new Date('2026-12-01T12:00:00.000Z'));

    expect(screen.queryByText(/runs for at most/)).not.toBeInTheDocument();
  });
});
