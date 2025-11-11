import { useProcedure } from '@/lib/mrpc/hook';
import deleteSweepstakes from '@/procedures/sweepstakes/delete-sweepstakes';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export const useDeleteSweepstakes = (onSuccess: () => void) => {
  const router = useRouter();
  return useProcedure({
    action: deleteSweepstakes,
    onSuccess() {
      onSuccess();
      router.refresh();
    },
    onFailure(err) {
      if (err.code === 'NOT_FOUND') {
        toast.error(
          "The item you're trying to delete could not be found. Refresh the page, or try again later."
        );
      } else {
        toast.error(err.message);
      }
    }
  });
};
