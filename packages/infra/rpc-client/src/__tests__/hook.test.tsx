import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Result } from '@giveaway/rpc-model/types';
import { useProcedureAsync } from '../hook';

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));

const deferred = <T,>() => {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

describe('useProcedureAsync', () => {
  it('resolves with the data of a successful result', async () => {
    const action = vi.fn(
      async (input: { id: string }): Promise<Result<string>> => ({
        ok: true,
        data: `done ${input.id}`
      })
    );
    const { result } = renderHook(() => useProcedureAsync({ action }));

    await expect(act(() => result.current.run({ id: 'task-1' }))).resolves.toBe(
      'done task-1'
    );
    expect(action).toHaveBeenCalledWith({ id: 'task-1' });
  });

  it('rejects with the data of a failed result', async () => {
    const failure = { code: 'BAD_REQUEST', message: 'Already completed.' };
    const action = vi.fn(
      async (): Promise<Result<string>> =>
        ({ ok: false, data: failure }) as Result<string>
    );
    const { result } = renderHook(() => useProcedureAsync({ action }));

    await expect(act(() => result.current.run())).rejects.toEqual(failure);
  });

  it('rejects with an unknown error when the action throws', async () => {
    const action = vi.fn(async (): Promise<Result<string>> => {
      throw new Error('Network down');
    });
    const { result } = renderHook(() => useProcedureAsync({ action }));

    await expect(act(() => result.current.run())).rejects.toEqual({
      code: 'UNKNOWN_HTTP_ERROR',
      message: 'Network down'
    });
  });

  it('is loading only while the action runs', async () => {
    const pending = deferred<Result<string>>();
    const action = vi.fn(() => pending.promise);
    const { result } = renderHook(() => useProcedureAsync({ action }));
    expect(result.current.isLoading).toBe(false);

    let run: Promise<string> = Promise.resolve('');
    act(() => {
      run = result.current.run();
    });
    await waitFor(() => expect(result.current.isLoading).toBe(true));

    await act(async () => {
      pending.resolve({ ok: true, data: 'done' });
      await run;
    });
    expect(result.current.isLoading).toBe(false);
  });
});
