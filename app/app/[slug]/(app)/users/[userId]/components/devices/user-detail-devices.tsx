import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { datetime } from '@/lib/date';
import {
  USER_AGENT_DEVICE_ICON,
  UserDeviceActivitySchema
} from '@/schemas/user-agent';

export const UserAgentActivity: React.FC<{
  activities: UserDeviceActivitySchema[];
}> = ({ activities }) => (
  <TabsContent value="devices" className="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle>Device & Browser Information</CardTitle>
        <CardDescription>Devices used to access the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = USER_AGENT_DEVICE_ICON[activity.device];
            return (
              <div
                key={activity.id}
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
                  <div className="text-sm font-medium">
                    {activity.sessions} sessions
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Last: {datetime.format(activity.lastUsed)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  </TabsContent>
);
