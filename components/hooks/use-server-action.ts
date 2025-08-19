import { ValidationError } from '@/lib/errors';
import { useCallback, useTransition } from 'react';
import z from 'zod';

export const useServerAction = <T>({
  schema,
  action,
  onSuccess,
  onError
}: {
  action: () => Promise<unknown>;
  schema: z.ZodType<T>;
  onSuccess: (data: T) => void;
  onError: (error: Error) => void;
}): [boolean, () => void] => {
  const [isPending, startTransition] = useTransition();

  const handleAction = useCallback(() => {
    startTransition(async () => {
      const result = await action();
      const parsed = schema.safeParse(result);
      if (!parsed.success) {
        onError(
          new ValidationError({
            message: 'Unprocessable content',
            cause: parsed.error
          })
        );
      } else {
        onSuccess(parsed.data);
      }
    });
  }, [schema, action, onSuccess, onError, startTransition]);

  return [isPending, handleAction];
};
