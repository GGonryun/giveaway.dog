import { datetime } from '@/lib/date';
import {
  UserDeviceActivitySchema,
  USER_AGENT_DEVICE_ICON
} from '@/schemas/user-agent';

export const DeviceActivityInfo: React.FC<{
  activity: UserDeviceActivitySchema;
}> = ({ activity }) => {
  const Icon = USER_AGENT_DEVICE_ICON[activity.device];
  return (
    <div
      key={activity.agent}
      className="flex items-center justify-between p-4 border rounded-lg"
    >
      <div className="flex items-center space-x-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div>
          <div className="font-medium">{activity.device}</div>
          <div className="text-sm text-muted-foreground">
            {activity.os} • {activity.browser}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium">{activity.count} sessions</div>
        <div className="text-xs text-muted-foreground">
          Last: {datetime.format(activity.lastUsed)}
        </div>
      </div>
    </div>
  );
};
