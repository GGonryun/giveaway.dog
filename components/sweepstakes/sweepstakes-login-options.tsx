import { usePathname } from 'next/navigation';
import { useGiveawayParticipation } from './giveaway-participation-context';
import { LoginOptions } from '../auth/login-options';

export const SweepstakesLoginOptions: React.FC = () => {
  const { sweepstakes } = useGiveawayParticipation();

  const pathname = usePathname();

  return (
    <div className="mt-2 mb-4">
      <LoginOptions
        label={'Connect to participate...'}
        redirectTo={pathname}
        returnTo={pathname}
        allowedIdentities={sweepstakes.audience.allowedIdentities}
        type="dots"
      />
    </div>
  );
};
