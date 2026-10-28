export const REQUEST_TIMEOUT_MS = 15_000;

export const requestTimeout = (
  ms: number = REQUEST_TIMEOUT_MS,
  signal?: AbortSignal | null
): AbortSignal => {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(
      new DOMException(
        'The operation was aborted due to timeout',
        'TimeoutError'
      )
    );
  }, ms);
  timer.unref?.();
  return signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal;
};
