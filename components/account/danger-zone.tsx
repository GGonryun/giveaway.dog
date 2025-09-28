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
} from '../ui/alert-dialog';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../ui/card';
import { toast } from 'sonner';
import { useProcedure } from '@/lib/mrpc/hook';

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
    <Card>
      <CardHeader>
        <CardTitle>Account Actions</CardTitle>
        <CardDescription>
          Manage your account settings and deletion
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
              <p className="text-sm font-medium text-destructive">
                ⚠️ Your account deletion will be fully processed after any
                giveaways you've entered have completed.
              </p>
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
        <p className="text-xs text-muted-foreground">
          Account deletion is permanent and cannot be reversed.
        </p>
      </CardContent>
    </Card>
  );
};
