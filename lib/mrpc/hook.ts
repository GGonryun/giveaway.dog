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
  run: () => void;
};
export function useProcedure<TInput, TSuccess>(args: {
  action: (input: TInput) => Promise<Result<TSuccess>>;
  onSuccess?: (data: TSuccess) => void;
  onFailure?: (error: Failure['data']) => void;
}): {
  isLoading: boolean;
  isPending: boolean;
  run: (input: TInput) => void;
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
  run: ((input: TInput) => void) | (() => void);
} {
  const [isPending, setIsPending] = useState(true);
  const [isLoading, startTransition] = useTransition();

  const handleAction = useCallback(
    (input: any) => {
      startTransition(async () => {
        try {
          const result = await action(input);

          if (!result) {
            // this should only ever happen on redirects
            return;
          }

          if (result.ok) {
            onSuccess?.(result.data);
          } else {
            onFailure?.(result.data);
          }
        } catch (error: any) {
          if (isNextRedirect(error)) {
            throw error;
          }
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

  return { isLoading, isPending, run: handleAction };
}
