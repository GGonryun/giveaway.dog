import { render } from '@testing-library/react';
import React from 'react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import toggleVisibility from '@/procedures/sweepstakes/toggle-visibility';
import { SweepstakesStatusComponent } from '../sweepstakes-status';
import { FIXED_NOW } from './form-harness';
import { stabilizeIds } from './stable-dom';

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

  describe('snapshots', () => {
    it('matches the snapshot of a running public sweepstakes', () => {
      const { container } = renderStatus({
        visibility: 'PUBLIC',
        sweepstakesUrl: 'https://giveaway.dog/browse/summer',
        onGenerateQR: vi.fn()
      });
      expect(stabilizeIds(container)).toMatchSnapshot();
    });

    it('matches the snapshot of an expired sweepstakes without winners', () => {
      const { container } = renderStatus({
        status: 'EXPIRED',
        startDate: new Date('2026-05-01T12:00:00.000Z'),
        endDate: new Date('2026-06-01T12:00:00.000Z'),
        onPickWinners: vi.fn()
      });
      expect(stabilizeIds(container)).toMatchSnapshot();
    });
  });
});
