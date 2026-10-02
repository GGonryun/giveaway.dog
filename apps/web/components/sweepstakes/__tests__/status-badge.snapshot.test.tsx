import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SweepstakesStatusBadge } from '../status-badge';
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
        expect(container.firstChild).toMatchSnapshot();
      }
    );
  });
});
