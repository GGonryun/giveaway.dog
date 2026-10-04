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
} from '@giveaway/ui-primitives/alert-dialog';
import { useProcedure } from '@/lib/mrpc/hook';
import removeMember from '@/procedures/teams/remove-member';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@giveaway/ui-primitives/alert';
import { TriangleAlertIcon } from 'lucide-react';

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
          <Alert variant="warning">
            <TriangleAlertIcon />
            <AlertDescription>{blockReason}</AlertDescription>
          </Alert>
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
