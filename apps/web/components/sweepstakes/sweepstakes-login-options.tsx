import { usePathname, useSearchParams } from 'next/navigation';
import { useGiveawayParticipation } from './giveaway-participation-context';
import { LoginOptions } from '../auth/login-options';
import { useMemo } from 'react';

export const SweepstakesLoginOptions: React.FC = () => {
  const { sweepstakes } = useGiveawayParticipation();

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fullPath = useMemo(() => {
    const search = searchParams.toString();
    return search ? `${pathname}?${search}` : pathname;
  }, [pathname, searchParams]);

  return (
    <div className="mt-2 mb-4">
      <LoginOptions
        label={'Connect to participate...'}
        redirectTo={fullPath}
        returnTo={fullPath}
        allowedIdentities={sweepstakes.audience.allowedIdentities}
        type="dots"
      />
    </div>
  );
};
