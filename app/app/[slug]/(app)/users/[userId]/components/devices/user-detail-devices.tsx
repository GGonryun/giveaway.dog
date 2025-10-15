import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import { UserDeviceActivitySchema } from '@/schemas/user-agent';
import { DeviceActivityInfo } from './device-activity-info';

export const UserAgentActivity: React.FC<{
  activities: UserDeviceActivitySchema[];
}> = ({ activities }) => (
  <div className="space-y-2">
    <Card>
      <CardHeader>
        <CardTitle>Device & Browser Information</CardTitle>
        <CardDescription>Devices used to access the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, i) => (
            <DeviceActivityInfo key={i} activity={activity} />
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);
