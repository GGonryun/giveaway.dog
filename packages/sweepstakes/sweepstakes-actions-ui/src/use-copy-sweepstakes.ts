import { useProcedure } from '@giveaway/rpc-client/hook';
import copySweepstakes from '@giveaway/sweepstakes-editor-server/copy-sweepstakes';
import { toast } from 'sonner';

export const useCopySweepstakes = (
  onSuccess: (data: { id: string; slug: string }) => void
) => {
  return useProcedure({
    action: copySweepstakes,
    onSuccess,
    onFailure(err) {
      if (err.code === 'NOT_FOUND') {
        toast.error(
          "The sweepstakes you're trying to copy could not be found. Refresh the page, or try again later."
        );
      } else {
        toast.error(err.message);
      }
    }
  });
};
