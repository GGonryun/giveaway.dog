import { EmptyState } from '@/components/ui/empty-state';
import { Clock, TrendingUp, Activity } from 'lucide-react';

export function NoQualityScore() {
  return (
    <EmptyState
      title="No Quality Score Available"
      description="This user's quality score is being currently being calculated"
      alertMessage="Quality scores are calculated after collecting user activity data. Please wait at least 24 hours for enough metrics to be gathered before a score can be generated."
      trackedItems={[
        {
          icon: Activity,
          iconColor: 'text-blue-600',
          title: 'User Activity',
          description: 'Monitoring login patterns, device usage, and engagement'
        },
        {
          icon: TrendingUp,
          iconColor: 'text-green-600',
          title: 'Quality Indicators',
          description:
            'Analyzing account age, verification status, and task completion'
        },
        {
          icon: Clock,
          iconColor: 'text-orange-600',
          title: 'Risk Assessment',
          description:
            'Checking for suspicious patterns and potential fraud signals'
        }
      ]}
      footerMessage="The quality score will appear here once enough data has been collected and processed by our nightly scoring job."
    />
  );
}
