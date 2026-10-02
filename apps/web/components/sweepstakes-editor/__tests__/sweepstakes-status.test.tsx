import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import toggleVisibility from '@/procedures/sweepstakes/toggle-visibility';
import { SweepstakesStatusComponent } from '../sweepstakes-status';
import { FIXED_NOW } from './form-harness';

vi.hoisted(() => {
  process.env.TZ = 'UTC';
});

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => router }));

vi.mock('@/procedures/sweepstakes/toggle-visibility', () => ({
  default: vi.fn()
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() }
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

type StatusProps = React.ComponentProps<typeof SweepstakesStatusComponent>;
type ToggleResult = Awaited<ReturnType<typeof toggleVisibility>>;

const mockedToggleVisibility = vi.mocked(toggleVisibility);

const renderStatus = (props: Partial<StatusProps> = {}) => {
  const onCompleteSweepstakes = vi.fn();
  const view = render(
    <SweepstakesStatusComponent
      sweepstakesId="sweepstakes-1"
      status="RUNNING"
      startDate={new Date('2026-06-01T12:00:00.000Z')}
      endDate={new Date('2026-07-01T12:00:00.000Z')}
      timeZone="UTC"
      isCompleting={false}
      onCompleteSweepstakes={onCompleteSweepstakes}
      {...props}
    />
  );
  return { ...view, onCompleteSweepstakes };
};

const getIconButton = (icon: string) => {
  const button = document
    .querySelector(`button > svg.lucide-${icon}`)
    ?.closest('button');
  if (!button) throw new Error(`The ${icon} button was not found`);
  return button;
};

describe('SweepstakesStatusComponent', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(FIXED_NOW);
    mockedToggleVisibility.mockReset();
    router.refresh.mockReset();
    vi.mocked(toast.error).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('status', () => {
    it('describes the status and shows its badge', () => {
      renderStatus({ status: 'SCHEDULED' });
      expect(
        screen.getByText('Your sweepstakes is scheduled to start')
      ).toBeInTheDocument();
      expect(screen.getByText('Scheduled')).toBeInTheDocument();
    });

    it('says a completed sweepstakes cannot be modified', () => {
      renderStatus({ status: 'COMPLETED', visibility: 'PUBLIC' });
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Sweepstakes CompletedThis sweepstakes is complete. It cannot be modified further.'
      );
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });
  });

  describe('when the sweepstakes expired', () => {
    const expired = {
      status: 'EXPIRED',
      startDate: new Date('2026-05-01T12:00:00.000Z'),
      endDate: new Date('2026-06-01T12:00:00.000Z')
    } as const;

    it('asks to select winners when they are missing', async () => {
      const onPickWinners = vi.fn();
      renderStatus({ ...expired, onPickWinners });
      expect(
        screen.getByText('Action Required: Winners Not Selected')
      ).toBeInTheDocument();

      await userEvent.click(
        screen.getByRole('button', { name: 'Select Winners' })
      );
      expect(onPickWinners).toHaveBeenCalledTimes(1);
    });

    it('hides the select winners button without a handler', () => {
      renderStatus(expired);
      expect(
        screen.queryByRole('button', { name: 'Select Winners' })
      ).not.toBeInTheDocument();
    });

    it('offers to complete the sweepstakes once all winners are selected', async () => {
      const { onCompleteSweepstakes } = renderStatus({
        ...expired,
        hasAllWinnersSelected: true
      });
      expect(
        screen.queryByText('Action Required: Winners Not Selected')
      ).not.toBeInTheDocument();

      await userEvent.click(
        screen.getByRole('button', { name: 'Mark as Completed' })
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Yes, Complete Sweepstakes' })
      );
      expect(onCompleteSweepstakes).toHaveBeenCalledTimes(1);
    });

    it('shows that the sweepstakes is being completed', () => {
      renderStatus({
        ...expired,
        hasAllWinnersSelected: true,
        isCompleting: true
      });
      expect(
        screen.getByRole('button', { name: 'Completing...' })
      ).toBeDisabled();
    });
  });

  describe('visibility', () => {
    it.each([
      ['PRIVATE', 'Sweepstakes is Private', 'Private'],
      ['UNLISTED', 'Sweepstakes is Unlisted', 'Unlisted'],
      ['PUBLIC', 'Sweepstakes is Public', 'Public']
    ] as const)('explains the %s visibility', (visibility, title, label) => {
      renderStatus({ visibility });
      expect(screen.getByRole('alert')).toHaveTextContent(title);
      expect(screen.getByRole('combobox')).toHaveTextContent(label);
    });

    it('treats a missing visibility as private', () => {
      renderStatus();
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Sweepstakes is Private'
      );
    });

    it('changes the visibility and refreshes the page', async () => {
      mockedToggleVisibility.mockResolvedValue({
        ok: true,
        data: { visibility: 'PUBLIC' }
      });
      renderStatus({ visibility: 'PRIVATE' });
      await userEvent.click(screen.getByRole('combobox'));
      await userEvent.click(screen.getByRole('option', { name: 'Public' }));

      expect(mockedToggleVisibility).toHaveBeenCalledWith({
        sweepstakesId: 'sweepstakes-1',
        visibility: 'PUBLIC'
      });
      await waitFor(() => expect(router.refresh).toHaveBeenCalledTimes(1));
    });

    it('shows the error and keeps the page when the change fails', async () => {
      mockedToggleVisibility.mockResolvedValue({
        ok: false,
        data: { code: 'PAYMENT_REQUIRED', message: 'Upgrade to change this' }
      });
      renderStatus({ visibility: 'UNLISTED' });
      await userEvent.click(screen.getByRole('combobox'));
      await userEvent.click(screen.getByRole('option', { name: 'Public' }));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('Upgrade to change this')
      );
      expect(router.refresh).not.toHaveBeenCalled();
    });

    it('disables the visibility while it changes', async () => {
      mockedToggleVisibility.mockReturnValue(
        new Promise<ToggleResult>(() => {})
      );
      renderStatus({ visibility: 'PUBLIC' });
      await userEvent.click(screen.getByRole('combobox'));
      await userEvent.click(screen.getByRole('option', { name: 'Unlisted' }));

      await waitFor(() => expect(screen.getByRole('combobox')).toBeDisabled());
    });
  });

  describe('timing', () => {
    it.each([
      ['RUNNING', '2026-06-01', '2026-07-01', 'Ends in 16 days'],
      ['SCHEDULED', '2026-07-01', '2026-07-15', 'Starts in 16 days'],
      ['EXPIRED', '2026-05-01', '2026-06-01', 'Finished 14 days ago'],
      ['DRAFT', '2026-07-01', '2026-07-15', 'Not started']
    ] as const)(
      'describes a %s sweepstakes from %s to %s as "%s"',
      (status, start, end, description) => {
        renderStatus({
          status,
          startDate: new Date(`${start}T12:00:00.000Z`),
          endDate: new Date(`${end}T12:00:00.000Z`)
        });
        expect(screen.getByText(description)).toBeInTheDocument();
      }
    );

    it('shows the time zone and the dates', () => {
      renderStatus({ timeZone: 'Asia/Tokyo' });
      expect(
        screen.getByText('(GMT+09:00) Japan Standard Time')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Start Date').nextElementSibling
      ).toHaveTextContent('Jun 1, 2026 at 12:00 PM');
      expect(screen.getByText('End Date').nextElementSibling).toHaveTextContent(
        'Jul 1, 2026 at 12:00 PM'
      );
    });
  });

  describe('sharing', () => {
    it('hides the sharing section without a URL', () => {
      renderStatus();
      expect(screen.queryByText('Share Sweepstakes')).not.toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('shows the URL and opens it in a new tab', () => {
      renderStatus({ sweepstakesUrl: 'https://giveaway.dog/browse/summer' });
      const section = screen.getByText('Share Sweepstakes').parentElement;
      if (!section) throw new Error('Sharing section not found');

      expect(within(section).getByRole('textbox')).toHaveValue(
        'https://giveaway.dog/browse/summer'
      );
      const link = within(section).getByRole('link');
      expect(link).toHaveAttribute(
        'href',
        'https://giveaway.dog/browse/summer'
      );
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('generates a QR code when a handler is given', async () => {
      const onGenerateQR = vi.fn();
      renderStatus({
        sweepstakesUrl: 'https://giveaway.dog/browse/summer',
        onGenerateQR
      });
      await userEvent.click(getIconButton('qr-code'));
      expect(onGenerateQR).toHaveBeenCalledTimes(1);
    });

    it('hides the QR code button without a handler', () => {
      renderStatus({ sweepstakesUrl: 'https://giveaway.dog/browse/summer' });
      expect(document.querySelector('.lucide-qr-code')).not.toBeInTheDocument();
    });
  });
});
