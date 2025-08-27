import logout from '@/procedures/auth/logout';
import { useProcedure } from '@/lib/mrpc/hook';
import { toast } from 'sonner';

export const useLogout = () => {
  const logoutProcedure = useProcedure({
    action: logout,
    onSuccess() {
      toast.success('You have been logged out!');
    }
  });

  return logoutProcedure;
};
