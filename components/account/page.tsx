'use client';

import { LoaderCircleIcon, LogOutIcon } from 'lucide-react';
import { useLogout } from '../auth/use-logout';
import { UserSettings } from './user-settings';
import { Button } from '../ui/button';

export const UserPage: React.FC = () => {
  const logout = useLogout();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
        <p className="text-muted-foreground">
          Manage your profile and settings
        </p>
      </div>

      <UserSettings />

      {/* Logout Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => logout.run('/')}
          disabled={logout.isLoading}
          variant="outline"
          className="w-full sm:w-auto"
        >
          {logout.isLoading ? (
            <LoaderCircleIcon className="animate-spin h-4 w-4 mr-2" />
          ) : (
            <LogOutIcon className="h-4 w-4 mr-2" />
          )}
          Logout
        </Button>
      </div>
    </div>
  );
};
