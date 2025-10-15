import { EmptyState } from '@/components/ui/empty-state';
import { Clock, Monitor, Activity } from 'lucide-react';

export function NoDeviceActivity() {
  return (
    <EmptyState
      title="No Device Activity Yet"
      description="We're currently collecting user metrics"
      alertMessage="Device and browser information will appear after user activity is collected. Please wait at least 24 hours for enough actions to be compiled."
      trackedItems={[
        {
          icon: Monitor,
          iconColor: 'text-blue-600',
          title: 'Device Information',
          description: 'Tracking browser type, operating system, and device details'
        },
        {
          icon: Activity,
          iconColor: 'text-green-600',
          title: 'Usage Patterns',
          description: 'Monitoring login frequency and session activity'
        },
        {
          icon: Clock,
          iconColor: 'text-orange-600',
          title: 'Access Times',
          description: 'Recording when and how often the user accesses the platform'
        }
      ]}
      footerMessage="Device and browser information will be displayed here once the user performs actions on the platform."
    />
  );
}
