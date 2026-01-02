'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react';
import { getCookie } from 'cookies-next/client';
import { TURNSTILE_COOKIE_NAME } from './consts';
import verifyTurnstile from './verify';
import { useProcedure, useProcedureAsync } from '@/lib/mrpc/hook';
import { toast } from 'sonner';

interface TurnstileContextValue {
  isVerified: boolean;
  isVerifying: boolean;
  needsVerification: boolean;
  verify: (token: string, sweepstakesId?: string) => Promise<void>;
}

const TurnstileContext = createContext<TurnstileContextValue | null>(null);

interface TurnstileProviderProps {
  children: ReactNode;
  initialToken?: string | null;
}

export function TurnstileProvider({
  children,
  initialToken
}: TurnstileProviderProps) {
  const [isVerified, setIsVerified] = useState(() => !!initialToken);
  const [needsVerification, setNeedsVerification] = useState(
    () => !initialToken
  );

  const verifyProcedure = useProcedure({
    action: verifyTurnstile,
    onSuccess: (result) => {
      if (result.success) {
        setIsVerified(true);
        setNeedsVerification(false);
      } else {
        setIsVerified(false);
        setNeedsVerification(true);
      }
    },
    onFailure: (failure) => {
      setIsVerified(false);
      setNeedsVerification(true);
      toast.error('Verification failed. Please refresh the page to try again.');
      console.error('Turnstile verification failed', failure);
    }
  });

  useEffect(() => {
    // Check cookie if no initial token provided
    if (!initialToken) {
      const token = getCookie(TURNSTILE_COOKIE_NAME);
      const hasToken = !!token;
      setIsVerified(hasToken);
      setNeedsVerification(!hasToken);
    }
  }, [initialToken]);

  const verify = async (token: string) => {
    verifyProcedure.run({
      token
    });
  };

  return (
    <TurnstileContext.Provider
      value={{
        isVerified,
        isVerifying: verifyProcedure.isLoading,
        needsVerification,
        verify
      }}
    >
      {children}
    </TurnstileContext.Provider>
  );
}

export function useTurnstile() {
  const context = useContext(TurnstileContext);

  if (!context) {
    throw new Error('useTurnstile must be used within TurnstileProvider');
  }

  return context;
}
