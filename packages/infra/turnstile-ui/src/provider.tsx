import { TurnstileProvider as TurnstileContextProvider } from './context';
import { getLastTurnstileCheck } from '@giveaway/turnstile-server/check-status';

interface TurnstileProviderProps {
  children: React.ReactNode;
}

export async function TurnstileProvider({ children }: TurnstileProviderProps) {
  const turnstileResult = await getLastTurnstileCheck({});
  const initialToken =
    turnstileResult.ok && turnstileResult.data
      ? turnstileResult.data.token
      : null;

  return (
    <TurnstileContextProvider initialToken={initialToken}>
      {children}
    </TurnstileContextProvider>
  );
}
