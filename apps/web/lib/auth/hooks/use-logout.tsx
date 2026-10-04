'use client';

import { useProcedure } from '@giveaway/rpc-client/hook';
import { toast } from 'sonner';
import logout from '@giveaway/auth-actions/logout';

export const useLogout = () => {
  const logoutProcedure = useProcedure({
    action: logout,
    onSuccess() {
      toast.success('You have been logged out!');
    }
  });

  return logoutProcedure;
};
