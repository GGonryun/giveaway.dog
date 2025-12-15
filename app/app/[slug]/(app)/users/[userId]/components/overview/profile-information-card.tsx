'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  MapPin,
  Calendar,
  Activity,
  Mail,
  CircleXIcon,
  CircleCheckIcon
} from 'lucide-react';
import { datetime } from '@/lib/date';
import { UserSchema } from '@/schemas/user';

export const ProfileInformationCard: React.FC<{
  user: UserSchema;
  lastEntryAt: Date | null;
  providers: React.ReactNode;
}> = ({ user, providers, lastEntryAt }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2">{providers}</div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="flex items-center gap-1">
              {user.email}
              {user.emailVerified ? (
                <CircleCheckIcon className="h-3 w-3 text-success" />
              ) : (
                <CircleXIcon className="h-3 w-3 text-destructive" />
              )}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{user.countryCode}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Joined {datetime.format(user.createdAt, 'short')}</span>
          </div>
          {lastEntryAt && (
            <div className="flex items-center space-x-2 text-sm">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span>Last active {datetime.format(lastEntryAt, 'short')}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
