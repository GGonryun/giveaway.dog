'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useProcedure } from '@/lib/mrpc/hook';
import removeMember from '@/procedures/teams/remove-member';
import { toast } from 'sonner';

interface RemoveMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  membershipId: string;
  memberName: string;
  memberEmail: string;
  blockReason: string | null;
  onSuccess: () => void;
}

export const RemoveMemberDialog: React.FC<RemoveMemberDialogProps> = ({
  open,
  onOpenChange,
  slug,
  membershipId,
  memberName,
  memberEmail,
  blockReason,
  onSuccess
}) => {
  const { isLoading, run: remove } = useProcedure({
    action: removeMember,
    onSuccess() {
      toast.success('Member removed successfully');
      onOpenChange(false);
      onSuccess();
    },
    onFailure(error) {
      toast.error(error.message);
    }
  });

  const handleRemove = () => {
    remove({ slug, membershipId });
  };

  if (blockReason) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cannot Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">{memberName || memberEmail}</span>{' '}
              cannot be removed from the team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/50">
            <p className="font-medium text-amber-900 dark:text-amber-200">
              {blockReason}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove{' '}
            <span className="font-semibold">{memberName || memberEmail}</span>{' '}
            from the team? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Removing...' : 'Remove Member'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
