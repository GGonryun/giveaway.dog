import { LoaderCircleIcon, LogOutIcon } from 'lucide-react';
import { useLogout } from '../auth/use-logout';
import { Button } from '../ui/button';

export const LogoutButton = () => {
  const logout = useLogout();

  return (
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
  );
};
