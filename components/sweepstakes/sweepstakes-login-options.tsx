import { usePathname } from 'next/navigation';
import { useGiveawayParticipation } from './giveaway-participation-context';
import { LoginOptions } from '../auth/login-options';

export const SweepstakesLoginOptions: React.FC = () => {
  const { userProfile, sweepstakes } = useGiveawayParticipation();

  const pathname = usePathname();

  return (
    <div className="mt-2 mb-4">
      <LoginOptions
        label={'Connect to participate...'}
        redirectTo={pathname}
        allowedIdentities={sweepstakes.audience.allowedIdentities}
        type="badges"
      />
    </div>
  );
};
