'use client';

import { toMostRecentCompletion } from '@/lib/task/completions';
import { ProfileInformationCard } from './profile-information-card';
import { UserProviders } from '@/lib/integrations/components/user-providers';
import { SweepstakesParticipantSchema } from '@/lib/participant/schemas';
import { toSweepstakesEngagement } from '@/lib/participant/db';
import type { UserSignals } from '@/procedures/user/get-user-signals';
import { AccountSignalsCard } from './account-signals-card';

export const UserDetailsOverview: React.FC<{
  participant: SweepstakesParticipantSchema;
  totalTasks: number;
  slug: string;
  signals: UserSignals | null;
}> = ({ participant, totalTasks, slug, signals }) => {
  return (
    <div className="space-y-2">
      <ProfileInformationCard
        user={participant.user}
        lastEntryAt={toMostRecentCompletion(participant.completions)}
        providers={<UserProviders providers={participant.user.providers} />}
        slug={slug}
        totalEntries={participant.completions.length}
        engagement={toSweepstakesEngagement(
          participant.completions,
          totalTasks
        )}
      />
      {signals && <AccountSignalsCard signals={signals} />}
    </div>
  );
};
