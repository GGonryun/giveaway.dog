import { Failure, Result } from '@/lib/mrpc/types';
import { useCallback, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { isNextRedirect } from './errors';

const guard = (error: unknown) => {
  toast.error(parseError(error));
};
const parseError = (error: any) =>
  error?.message ?? 'An unexpected error occurred.';

export function useProcedure<TSuccess>(args: {
  action: () => Promise<Result<TSuccess>>;
  onSuccess?: (data: TSuccess) => void;
  onFailure?: (error: Failure['data']) => void;
}): {
  isLoading: boolean;
  isPending: boolean;
  isSubmitting: boolean;
  run: () => void;
  reset: () => void;
};
export function useProcedure<TInput, TSuccess>(args: {
  action: (input: TInput) => Promise<Result<TSuccess>>;
  onSuccess?: (data: TSuccess) => void;
  onFailure?: (error: Failure['data']) => void;
}): {
  isLoading: boolean;
  isPending: boolean;
  isSubmitting: boolean;
  run: (input: TInput) => void;
  reset: () => void;
};
// --- Implementation ---
export function useProcedure<TInput, TSuccess>({
  action,
  onSuccess,
  onFailure = guard
}: {
  action:
    | ((input: TInput) => Promise<Result<TSuccess>>)
    | (() => Promise<Result<TSuccess>>);
  onSuccess?: (data: TSuccess) => void;
  onFailure?: (error: Failure['data']) => void;
}): {
  isLoading: boolean;
  isPending: boolean;
  // a strange state that is set to false when the action finishes because of a failure.
  isSubmitting: boolean;
  run: ((input: TInput) => void) | (() => void);
  reset: () => void;
} {
  const [isPending, setIsPending] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, startTransition] = useTransition();

  const handleAction = useCallback(
    (input: any) => {
      startTransition(async () => {
        setIsSubmitting(true);
        try {
          const result = await action(input);

          if (!result) {
            // this should only ever happen on redirects
            return;
          }

          if (result.ok) {
            onSuccess?.(result.data);
          } else {
            setIsSubmitting(false);
            onFailure?.(result.data);
          }
        } catch (error: any) {
          if (isNextRedirect(error)) {
            throw error;
          }
          setIsSubmitting(false);
          onFailure({
            code: 'UNKNOWN_HTTP_ERROR',
            message: parseError(error)
          });
        } finally {
          setIsPending(false);
        }
      });
    },
    [action, onSuccess, onFailure, startTransition]
  );

  const reset = useCallback(() => {
    setIsPending(true);
    setIsSubmitting(false);
  }, []);

  return { isLoading, isPending, isSubmitting, reset, run: handleAction };
}

export function useProcedureAsync<TSuccess>(args: {
  action: () => Promise<Result<TSuccess>>;
}): {
  isLoading: boolean;
  run: () => Promise<TSuccess>;
};
export function useProcedureAsync<TInput, TSuccess>(args: {
  action: (input: TInput) => Promise<Result<TSuccess>>;
}): {
  isLoading: boolean;
  run: (input: TInput) => Promise<TSuccess>;
};
// --- Implementation ---
export function useProcedureAsync<TInput, TSuccess>({
  action
}: {
  action:
    | ((input: TInput) => Promise<Result<TSuccess>>)
    | (() => Promise<Result<TSuccess>>);
}): {
  isLoading: boolean;
  run: ((input: TInput) => Promise<TSuccess>) | (() => Promise<TSuccess>);
} {
  const [isLoading, startTransition] = useTransition();

  const handleAction = useCallback(
    async (input: any): Promise<TSuccess> => {
      return new Promise((resolve, reject) => {
        startTransition(async () => {
          try {
            const result = await action(input);

            if (!result) {
              // this should only ever happen on redirects

              return;
            }

            if (result.ok) {
              resolve(result.data);
            } else {
              reject(result.data);
            }
          } catch (error: any) {
            if (isNextRedirect(error)) {
              throw error;
            }
            reject({
              code: 'UNKNOWN_HTTP_ERROR',
              message: parseError(error)
            });
          }
        });
      });
    },
    [action, startTransition]
  );

  return { isLoading, run: handleAction };
}
