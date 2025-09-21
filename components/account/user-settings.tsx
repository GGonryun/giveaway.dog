'use client';

import { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

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
} from '@/components/ui/alert-dialog';
import { SocialProviders } from './social-providers';
import { User, Mail } from 'lucide-react';
import { useUser } from '@/components/context/user-provider';
import { useProcedure } from '@/lib/mrpc/hook';
import updateProfile from '@/procedures/user/update-profile';
import { UpdateUserProfile } from '@/schemas/user';
import { toast } from 'sonner';
import { UserType } from '@prisma/client';
import { DEFAULT_MINIMUM_AGE } from '@/schemas/giveaway/defaults';
import deleteUser from '@/procedures/user/delete-user';

const SAVE_DELAY = 600;

export const UserSettings = () => {
  const user = useUser();
  const updateProfileProcedure = useProcedure({
    action: updateProfile,
    onSuccess() {
      toast.success('Profile updated successfully');
    }
  });

  const deleteUserProcedure = useProcedure({
    action: deleteUser,
    onSuccess() {
      toast.success('Account deleted successfully');
    }
  });

  const [formData, setFormData] = useState<UpdateUserProfile>({
    id: user.id,
    name: user.name,
    type: user.type
  });

  const [showHostAccessDialog, setShowHostAccessDialog] = useState(false);

  const debouncedSave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (data: typeof formData) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          updateProfileProcedure.run(data);
        }, SAVE_DELAY);
      };
    })(),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newData = { ...formData, [name]: value };
    setFormData(newData);

    // Debounced auto-save for text inputs (name)
    if (name === 'name') {
      debouncedSave(newData);
    } else {
      // Immediate save for other inputs
      updateProfileProcedure.run(newData);
    }
  };

  const handleRequestHostAccess = () => {
    setShowHostAccessDialog(true);
  };

  const handleDeleteAccount = async () => {
    deleteUserProcedure.run();
  };

  return (
    <div className="space-y-6">
      {/* Profile Information Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information, avatar, and preferences
              </CardDescription>
            </div>
            {updateProfileProcedure.isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                Saving...
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name ?? ''}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder="Enter your display name"
                />
              </div>
            </div>

            {/* Account Type - Read-only */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Account Type</Label>
              <div className="space-y-2">
                {user.type?.includes(UserType.PARTICIPATE) && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Participant</span>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      Active
                    </span>
                  </div>
                )}
                {user.type?.includes(UserType.HOST) ? (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm">Host</span>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      Active
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 border border-dashed rounded-lg">
                    <span className="text-sm text-muted-foreground">
                      Host Access
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRequestHostAccess}
                    >
                      Request Access
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts Section */}
      <SocialProviders />

      {/* Account Actions Section */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>
            Manage your account settings and deletion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AlertDialog
            open={showHostAccessDialog}
            onOpenChange={setShowHostAccessDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  🚀 Host Access - Beta Feature
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Host access is currently in <strong>beta</strong> and not yet
                  available for public requests.
                </AlertDialogDescription>

                <AlertDialogDescription>
                  If you want early access, please contact us via our support page.
                  We're working hard to bring you the ability to create and host
                  your own giveaways.
                </AlertDialogDescription>

                <AlertDialogDescription>
                  Thank you for your patience as we perfect this feature!
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => setShowHostAccessDialog(false)}
                >
                  Okay
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <a href="/support" className="inline-flex">
                    Contact Support
                  </a>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

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
    </div>
  );
};
