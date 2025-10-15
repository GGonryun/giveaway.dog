import { EmptyState } from '@/components/ui/empty-state';
import { Clock, ListChecks, Trophy } from 'lucide-react';

export function NoEntries() {
  return (
    <EmptyState
      title="No Entries Yet"
      description="This user hasn't participated in any giveaways"
      alertMessage="Entry information will appear after the user completes tasks in giveaways. Please wait at least 24 hours for enough actions to be compiled."
      trackedItems={[
        {
          icon: Trophy,
          iconColor: 'text-blue-600',
          title: 'Giveaway Participation',
          description: 'Tracking which giveaways the user has entered'
        },
        {
          icon: ListChecks,
          iconColor: 'text-green-600',
          title: 'Task Completions',
          description: 'Monitoring completed tasks and entry methods'
        },
        {
          icon: Clock,
          iconColor: 'text-orange-600',
          title: 'Activity Timeline',
          description: 'Recording when and how the user participates in giveaways'
        }
      ]}
      footerMessage="Entry history will be displayed here once the user starts participating in giveaways."
    />
  );
}
