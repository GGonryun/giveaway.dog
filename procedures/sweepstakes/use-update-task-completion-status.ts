'use client';

import { updateTaskCompletionStatus } from './update-task-completion-status';
import { useProcedure } from '@/lib/mrpc/hook';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CompletionStatus } from '@prisma/client';

export const useUpdateTaskCompletionStatus = ({
  sweepstakesId
}: {
  sweepstakesId: string;
}) => {
  const router = useRouter();

  const procedure = useProcedure({
    action: updateTaskCompletionStatus,
    onSuccess: () => {
      toast.success('Task completion status updated');
      router.refresh();
    },
    onFailure: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    }
  });

  return {
    ...procedure,
    run: (input: {
      taskCompletionId: string;
      status: CompletionStatus;
      reason?: string;
    }) => procedure.run({ ...input, sweepstakesId })
  };
};
