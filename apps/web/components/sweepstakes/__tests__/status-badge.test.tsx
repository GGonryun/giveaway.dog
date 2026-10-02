import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DerivedSweepstakeStatus } from '@/schemas/sweepstakes';
import {
  SweepstakesStatusBadge,
  SweepstakesStatusDescription,
  SweepstakesStatusSummaryBadge
} from '../status-badge';
import { NOW } from './fixtures';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const fromNow = (ms: number) => new Date(NOW.getTime() + ms);

describe('status badges', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('SweepstakesStatusBadge', () => {
    it.each([
      ['DRAFT', 'Draft', 'bg-secondary'],
      ['RUNNING', 'Active', 'bg-primary'],
      ['SCHEDULED', 'Scheduled', 'text-foreground'],
      ['EXPIRED', 'Expired', 'bg-destructive'],
      ['COMPLETED', 'Completed', 'bg-success'],
      ['ERROR', 'Error', 'bg-destructive']
    ] as const)(
      'renders the %s status as "%s"',
      (status, label, variantClass) => {
        const { container } = render(
          <SweepstakesStatusBadge
            status={status}
            startDate={fromNow(-DAY)}
            endDate={fromNow(DAY)}
          />
        );
        expect(container.firstChild).toHaveTextContent(label);
        expect(container.firstChild).toHaveClass('text-sm', variantClass);
      }
    );

    it('throws for an unknown status', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() =>
        render(
          <SweepstakesStatusBadge
            status={'PAUSED' as DerivedSweepstakeStatus}
            startDate={NOW}
            endDate={NOW}
          />
        )
      ).toThrow('Unexpected value: PAUSED');
    });
  });

  describe('SweepstakesStatusDescription', () => {
    it.each([
      ['DRAFT', 'Your sweepstakes is being prepared'],
      ['RUNNING', 'Your sweepstakes is live'],
      ['SCHEDULED', 'Your sweepstakes is scheduled to start'],
      ['EXPIRED', 'Your sweepstakes has ended'],
      ['COMPLETED', 'Your sweepstakes is complete'],
      ['ERROR', 'There is an issue with your sweepstakes timing']
    ] as const)('describes the %s status', (status, description) => {
      render(
        <SweepstakesStatusDescription
          status={status}
          startDate={NOW}
          endDate={NOW}
        />
      );
      expect(screen.getByText(description)).toBeInTheDocument();
    });
  });

  describe('SweepstakesStatusSummaryBadge', () => {
    const renderSummary = (
      status: DerivedSweepstakeStatus,
      startDate: Date,
      endDate: Date
    ) =>
      render(
        <SweepstakesStatusSummaryBadge
          status={status}
          startDate={startDate}
          endDate={endDate}
        />
      );

    it('shows Draft for a draft even when it has ended', () => {
      const { container } = renderSummary(
        'DRAFT',
        fromNow(-10 * DAY),
        fromNow(-DAY)
      );
      expect(container).toHaveTextContent('Draft');
    });

    it('shows Finished once the end date has passed', () => {
      const { container } = renderSummary(
        'EXPIRED',
        fromNow(-10 * DAY),
        fromNow(-HOUR)
      );
      expect(container).toHaveTextContent('Finished');
      expect(container.firstChild).toHaveClass('bg-success');
    });

    it('shows Upcoming when the start is less than two days away', () => {
      const { container } = renderSummary(
        'SCHEDULED',
        fromNow(DAY + HOUR),
        fromNow(10 * DAY)
      );
      expect(container).toHaveTextContent('Upcoming');
    });

    it('shows Ending when three days or fewer are left', () => {
      const { container } = renderSummary(
        'RUNNING',
        fromNow(-10 * DAY),
        fromNow(3 * DAY)
      );
      expect(container).toHaveTextContent('Ending');
      expect(container.firstChild).toHaveClass('bg-destructive');
    });

    it('shows New when the giveaway started three days ago or less', () => {
      const { container } = renderSummary(
        'RUNNING',
        fromNow(-3 * DAY),
        fromNow(10 * DAY)
      );
      expect(container).toHaveTextContent('New');
    });

    it('shows New for a scheduled giveaway that starts in more than a day', () => {
      const { container } = renderSummary(
        'SCHEDULED',
        fromNow(3 * DAY),
        fromNow(10 * DAY)
      );
      expect(container).toHaveTextContent('New');
    });

    it('renders nothing for a giveaway that is neither new nor ending', () => {
      const { container } = renderSummary(
        'RUNNING',
        fromNow(-4 * DAY),
        fromNow(4 * DAY)
      );
      expect(container).toBeEmptyDOMElement();
    });
  });
});
