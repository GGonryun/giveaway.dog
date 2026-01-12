'use client';

import { reverifyTaskCompletion } from './reverify-task-completion';
import { useProcedure } from '@/lib/mrpc/hook';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export const useReverifyTaskCompletion = ({
  sweepstakesId
}: {
  sweepstakesId: string;
}) => {
  const router = useRouter();

  const procedure = useProcedure({
    action: reverifyTaskCompletion,
    onSuccess: (data: any) => {
      if (data.success) {
        toast.success('Task completion re-verified successfully');
      } else {
        toast.error(`Re-verification failed: ${data.error}`);
      }
      router.refresh();
    },
    onFailure: (error) => {
      toast.error(`Failed to re-verify: ${error.message}`);
    }
  });

  return {
    ...procedure,
    run: (input: { taskCompletionId: string }) =>
      procedure.run({ ...input, sweepstakesId })
  };
};
