'use client';

import deleteUser from '@/procedures/user/delete-user';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@giveaway/ui-primitives/alert-dialog';
import { Button } from '@giveaway/ui-primitives/button';

import { toast } from 'sonner';
import { useProcedure } from '@giveaway/rpc-client/hook';
import { SettingsCard } from '../settings/settings-card';
import { Alert, AlertDescription } from '@giveaway/ui-primitives/alert';
import { AlertTriangleIcon } from 'lucide-react';

export const DangerZone = () => {
  const deleteUserProcedure = useProcedure({
    action: deleteUser,
    onSuccess() {
      toast.success('Account deleted successfully');
    }
  });

  const handleDeleteAccount = async () => {
    deleteUserProcedure.run();
  };
  return (
    <SettingsCard
      variant="destructive"
      title="Account Actions"
      description="Manage your account settings and deletion"
      footer=" Account deletion is permanent and cannot be reversed."
      isSaving={deleteUserProcedure.isLoading}
      hasChanges={true}
      action={
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full sm:w-auto">
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to delete your account?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                This action cannot be undone. Your account will be permanently
                deleted.
              </AlertDialogDescription>
              <Alert variant="destructive" className="mt-2">
                <AlertTriangleIcon />
                <AlertDescription>
                  Your account deletion will be fully processed after any
                  giveaways you've entered have completed.
                </AlertDescription>
              </Alert>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      }
    ></SettingsCard>
  );
};
