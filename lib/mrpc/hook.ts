import { Failure, Result } from '@/lib/mrpc/types';
import { useCallback, useTransition } from 'react';
import { toast } from 'sonner';

const guard = (error: unknown) => {
  toast.error(parseError(error));
};
const parseError = (error: any) =>
  error?.message ?? 'An unexpected error occurred.';

export function useProcedure<TSuccess>(args: {
  action: () => Promise<Result<TSuccess>>;
  onSuccess?: (data: TSuccess) => void;
  onFailure?: (error: Failure['data']) => void;
}): [boolean, () => void];
export function useProcedure<TInput, TSuccess>(args: {
  action: (input: TInput) => Promise<Result<TSuccess>>;
  onSuccess?: (data: TSuccess) => void;
  onFailure?: (error: Failure['data']) => void;
}): [boolean, (input: TInput) => void];
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
}): [boolean, ((input: TInput) => void) | (() => void)] {
  const [isPending, startTransition] = useTransition();

  const handleAction = useCallback(
    (input: any) => {
      startTransition(async () => {
        try {
          const result = await action(input);

          if (result.ok) {
            onSuccess?.(result.data);
          } else {
            onFailure?.(result.data);
          }
        } catch (error: any) {
          // normalize unexpected errors
          onFailure({
            code: 'UNKNOWN_HTTP_ERROR',
            message: parseError(error)
          });
        }
      });
    },
    [action, onSuccess, onFailure, startTransition]
  );

  return [isPending, handleAction];
}
