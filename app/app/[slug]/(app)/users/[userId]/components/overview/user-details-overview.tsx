'use client';

import { toMostRecentCompletion } from '@/lib/task/completions';
import { KeyMetricsCard } from './key-metrics-card';
import { ProfileInformationCard } from './profile-information-card';
import { UserProviders } from '@/lib/integrations/components/user-providers';
import { SweepstakesParticipantSchema } from '@/lib/participant/schemas';
import { toSweepstakesEngagement } from '@/lib/participant/db';

export const UserDetailsOverview: React.FC<{
  participant: SweepstakesParticipantSchema;
  totalTasks: number;
  slug: string;
}> = ({ participant, totalTasks, slug }) => {
  return (
    <div className="space-y-2">
      <ProfileInformationCard
        user={participant.user}
        lastEntryAt={toMostRecentCompletion(participant.completions)}
        providers={<UserProviders providers={participant.user.providers} />}
      />
      <KeyMetricsCard
        slug={slug}
        participant={participant}
        engagement={toSweepstakesEngagement(
          participant.completions,
          totalTasks
        )}
      />
    </div>
  );
};
