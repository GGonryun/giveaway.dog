import { useProcedure } from '@/lib/mrpc/hook';
import updateSweepstakesProcedure from '@/procedures/sweepstakes/update-sweepstakes';

export const useUpdateSweepstakes = (onSuccess: () => void) => {
  return useProcedure({
    action: updateSweepstakesProcedure,
    onSuccess
  });
};
