import { act, renderHook } from '@testing-library/react';
import { useTransition } from 'react';

export const PENDING_TRANSITION_MESSAGE =
  'A test in this file left a React transition pending: an async transition, such as the one that useProcedure starts, still waits for a promise that never settles, for example a mocked server action that returns new Promise(() => {}). React holds every later transition of this worker until it ends, so the tests of the next files in the worker would wait forever. Settle the promise before the test ends.';

const REPORTED = Symbol.for('@giveaway/testing-dom/pending-transition');

const worker = globalThis as typeof globalThis & { [REPORTED]?: boolean };

export const hasPendingTransition = async () => {
  const { result, unmount } = renderHook(() => useTransition());
  await act(async () => {
    result.current[1](async () => {});
  });
  const [isPending] = result.current;
  unmount();
  return isPending;
};

export const expectNoPendingTransition = async () => {
  const pending = await hasPendingTransition();
  const reported = worker[REPORTED] === true;
  worker[REPORTED] = pending;
  if (pending && !reported) {
    throw new Error(PENDING_TRANSITION_MESSAGE);
  }
};
