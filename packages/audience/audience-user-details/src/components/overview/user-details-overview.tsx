'use client';

import { toMostRecentCompletion } from '@giveaway/task-model/completions';
import { ProfileInformationCard } from './profile-information-card';
import { UserProviders } from '@giveaway/integration-ui/user-providers';
import { SweepstakesParticipantSchema } from '@giveaway/participant-model/schemas';
import { toSweepstakesEngagement } from '@giveaway/participant-model/db';
import type { UserSignals } from '@giveaway/audience-server/get-user-signals';
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
