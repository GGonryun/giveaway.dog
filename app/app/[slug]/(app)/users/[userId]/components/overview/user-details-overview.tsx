'use client';

import { SweepstakesParticipantSchema } from '@/schemas/giveaway/participant';
import { KeyMetricsCard } from './key-metrics-card';
import { ProfileInformationCard } from './profile-information-card';
import { UserSchema } from '@/schemas/user';
import { UserProviders } from './user-providers';

export const UserDetailsOverview: React.FC<{
  participant: SweepstakesParticipantSchema;
  user: UserSchema;
}> = ({ participant, user }) => {
  return (
    <>
      <div className="space-y-2">
        <ProfileInformationCard
          participant={participant}
          providers={<UserProviders user={user} />}
        />
        <KeyMetricsCard participant={participant} />
      </div>
    </>
  );
};
