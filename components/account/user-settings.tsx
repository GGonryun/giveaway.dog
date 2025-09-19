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
import { EmojiPickerComponent } from '@/components/patterns/emoji-picker';
import { CountrySelector } from '@/components/ui/country-selector';
import { EmailVerification } from '@/components/auth/email-verification';
import { SocialProviders } from './social-providers';
import { User, Calendar } from 'lucide-react';
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
    emoji: user.emoji,
    countryCode: user.countryCode || '',
    age: (user.age ?? DEFAULT_MINIMUM_AGE).toString(),
    type: user.type // Default to PARTICIPATE, can be ['HOST', 'PARTICIPATE']
  });

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

    // Debounced auto-save for text inputs (name, age)
    if (name === 'name' || name === 'age') {
      debouncedSave(newData);
    } else {
      // Immediate save for other inputs
      updateProfileProcedure.run(newData);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const newData = { ...formData, emoji };
    setFormData(newData);
    // Immediate save for emoji changes
    updateProfileProcedure.run(newData);
  };

  const handleUserTypeChange = (userType: UserType, checked: boolean) => {
    const newUserTypes = checked
      ? [...(formData.type ?? []), userType]
      : (formData.type?.filter((type) => type !== userType) ?? []);

    const newData = { ...formData, type: newUserTypes };
    setFormData(newData);
    // Immediate save for user type changes
    updateProfileProcedure.run(newData);
  };

  const handleCountryChange = (countryCode: string) => {
    const newData = { ...formData, region: countryCode };
    setFormData(newData);
    updateProfileProcedure.run(newData);
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
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            <div>
              <Label className="text-sm font-medium">Avatar</Label>
              <div>
                <EmojiPickerComponent
                  value={formData.emoji ?? '🐶'}
                  onEmojiSelect={handleEmojiSelect}
                  title="Choose your avatar emoji"
                  description="This emoji will represent you in the app"
                />
              </div>
            </div>
            {/* User Types */}
            <div className="col-span-1 lg:col-span-2">
              <Label className="text-sm font-medium">Account Type</Label>
              <div className="space-y-3 mt-0.5">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="host"
                    checked={formData.type?.includes(UserType.HOST) ?? false}
                    onCheckedChange={(checked) =>
                      handleUserTypeChange(UserType.HOST, checked as boolean)
                    }
                  />
                  <Label htmlFor="host" className="text-sm cursor-pointer">
                    Host Giveaways
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="participate"
                    checked={
                      formData.type?.includes(UserType.PARTICIPATE) ?? false
                    }
                    onCheckedChange={(checked) =>
                      handleUserTypeChange(
                        UserType.PARTICIPATE,
                        checked as boolean
                      )
                    }
                  />
                  <Label
                    htmlFor="participate"
                    className="text-sm cursor-pointer"
                  >
                    Participate in Giveaways
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
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

            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="age"
                  name="age"
                  type="number"
                  min="13"
                  max="120"
                  value={formData.age ?? 18}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder="Enter your age"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Management Section */}
      <EmailVerification user={user} redirectTo="/account" />

      {/* Social Providers Section */}
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
