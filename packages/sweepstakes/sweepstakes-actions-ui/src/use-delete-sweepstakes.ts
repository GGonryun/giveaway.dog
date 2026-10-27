import { useProcedure } from '@giveaway/rpc-client/hook';
import deleteSweepstakes from '@giveaway/sweepstakes-editor-server/delete-sweepstakes';
import deleteDraft from '@giveaway/sweepstakes-editor-server/delete-draft';
import { FailureData } from '@giveaway/rpc-model/types';
import { toast } from 'sonner';

const showDeleteFailure = (err: FailureData) => {
  if (err.code === 'NOT_FOUND') {
    toast.error(
      "The item you're trying to delete could not be found. Refresh the page, or try again later."
    );
  } else {
    toast.error(err.message);
  }
};

export const useDeleteSweepstakes = (onSuccess: () => void) => {
  return useProcedure({
    action: deleteSweepstakes,
    onSuccess() {
      onSuccess();
    },
    onFailure: showDeleteFailure
  });
};

export const useDeleteDraft = (onSuccess: () => void) => {
  return useProcedure({
    action: deleteDraft,
    onSuccess() {
      onSuccess();
    },
    onFailure: showDeleteFailure
  });
};
