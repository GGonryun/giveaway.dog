'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@giveaway/ui-primitives/dialog';
import { Button } from '@giveaway/ui-primitives/button';
import { useProcedure } from '@giveaway/rpc-client/hook';
import { deleteTaskCompletion } from '@/procedures/sweepstakes/delete-task-completion';
import { UserEntriesSchema } from '@/lib/task/schemas';

interface DeleteEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  completion: UserEntriesSchema;
  sweepstakesId: string;
  onDeleted?: () => void;
}

export const DeleteEntryDialog = ({
  open,
  onOpenChange,
  completion,
  sweepstakesId,
  onDeleted
}: DeleteEntryDialogProps) => {
  const { run, isLoading } = useProcedure({
    action: deleteTaskCompletion,
    onSuccess: () => {
      onOpenChange(false);
      onDeleted?.();
    }
  });

  const handleDelete = () => {
    run({
      taskCompletionId: completion.id,
      sweepstakesId
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Entry</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this entry? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1 text-sm">
          <div>
            <span className="text-muted-foreground">Participant: </span>
            <span className="font-medium">{completion.user.name}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Task: </span>
            <span className="font-medium">{completion.task.title}</span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
