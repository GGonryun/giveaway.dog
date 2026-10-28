import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LogoutScreen } from '../logout-screen';

const router = { push: vi.fn(), replace: vi.fn() };

vi.mock('next/navigation', () => ({
  useRouter: () => router
}));

describe('LogoutScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('[AUTH-009] counts down from 5 seconds before it signs out', async () => {
    const onDoneAction = vi.fn().mockResolvedValue(undefined);
    render(<LogoutScreen onDoneAction={onDoneAction} />);

    expect(screen.getByText(/Redirecting in/)).toHaveTextContent(
      'Redirecting in 5s'
    );

    await act(async () => {
      vi.advanceTimersByTime(1_050);
    });
    expect(screen.getByText(/Redirecting in/)).toHaveTextContent(
      'Redirecting in 4s'
    );

    await act(async () => {
      vi.advanceTimersByTime(3_000);
    });
    expect(screen.getByText(/Redirecting in/)).toHaveTextContent(
      'Redirecting in 1s'
    );
    expect(onDoneAction).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1_000);
    });
    expect(screen.getByText(/Redirecting in/)).toHaveTextContent(
      'Redirecting in 0s'
    );
    expect(onDoneAction).toHaveBeenCalledTimes(1);
  });
});
