import { useProcedure } from '@/lib/mrpc/hook';
import { toast } from 'sonner';
import logout from '../procedures/logout';

export const useLogout = () => {
  const logoutProcedure = useProcedure({
    action: logout,
    onSuccess() {
      toast.success('You have been logged out!');
    }
  });

  return logoutProcedure;
};
