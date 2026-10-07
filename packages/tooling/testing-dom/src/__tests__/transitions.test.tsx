import { act, renderHook } from '@testing-library/react';
import { useTransition } from 'react';
import { describe, expect, it } from 'vitest';
import {
  PENDING_TRANSITION_MESSAGE,
  expectNoPendingTransition,
  hasPendingTransition
} from '../transitions';

const startPendingTransition = () => {
  let settle = () => {};
  const { result } = renderHook(() => useTransition());
  act(() => {
    result.current[1](
      () =>
        new Promise<void>((resolve) => {
          settle = resolve;
        })
    );
  });
  return () => act(async () => settle());
};

describe('hasPendingTransition', () => {
  it('is false when every transition has ended', async () => {
    expect(await hasPendingTransition()).toBe(false);
  });

  it('is true while a transition waits for a promise, and false once the promise settles', async () => {
    const settle = startPendingTransition();

    expect(await hasPendingTransition()).toBe(true);

    await settle();

    expect(await hasPendingTransition()).toBe(false);
  });
});

describe('expectNoPendingTransition', () => {
  it('fails when a transition is pending, once until the transitions end', async () => {
    const settle = startPendingTransition();

    await expect(expectNoPendingTransition()).rejects.toThrow(
      PENDING_TRANSITION_MESSAGE
    );
    await expect(expectNoPendingTransition()).resolves.toBeUndefined();

    await settle();

    await expect(expectNoPendingTransition()).resolves.toBeUndefined();
  });

  it('fails again for a transition that is left pending after the earlier ones ended', async () => {
    const settleFirst = startPendingTransition();
    await expect(expectNoPendingTransition()).rejects.toThrow(
      PENDING_TRANSITION_MESSAGE
    );
    await settleFirst();
    await expectNoPendingTransition();

    const settleSecond = startPendingTransition();

    await expect(expectNoPendingTransition()).rejects.toThrow(
      PENDING_TRANSITION_MESSAGE
    );

    await settleSecond();
    await expectNoPendingTransition();
  });
});
