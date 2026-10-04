'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@giveaway/ui-primitives/card';
import { Badge } from '@giveaway/ui-primitives/badge';
import { Button } from '@giveaway/ui-primitives/button';
import Link from 'next/link';
import {
  MapPin,
  Calendar,
  Activity,
  Mail,
  CircleXIcon,
  CircleCheckIcon,
  SquareArrowOutUpRight
} from 'lucide-react';
import { datetime } from '@giveaway/util-time/date';
import { UserSchema } from '@/schemas/user';
import { ObfuscatedEmail } from '@giveaway/ui-primitives/obfuscated-email';
import {
  toQualityType,
  QUALITY_LABELS
} from '@giveaway/user-quality-model/quality';
import { QUALITY_BADGE_VARIANT } from '@/lib/user-quality/display';

export const ProfileInformationCard: React.FC<{
  user: UserSchema;
  lastEntryAt: Date | null;
  providers: React.ReactNode;
  slug: string;
  totalEntries: number;
  engagement: number;
}> = ({ user, providers, lastEntryAt, slug, totalEntries, engagement }) => {
  const qualityType = toQualityType(user.qualityScore);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>{user.name}</span>
          <Badge variant={QUALITY_BADGE_VARIANT[qualityType]}>
            {QUALITY_LABELS[qualityType]}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Identity info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-start gap-2">{providers}</div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex items-center gap-1">
                  <ObfuscatedEmail email={user.email} />
                  {user.emailVerified ? (
                    <CircleCheckIcon className="h-3 w-3 text-success" />
                  ) : (
                    <CircleXIcon className="h-3 w-3 text-destructive" />
                  )}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{user.countryCode}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Joined {datetime.format(user.createdAt, 'short')}</span>
              </div>
              {lastEntryAt && (
                <div className="flex items-center space-x-2 text-sm">
                  <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>
                    Last active {datetime.format(lastEntryAt, 'short')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Participation stats */}
          <div className="flex flex-col gap-3">
            <div className="bg-muted rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalEntries}</div>
                <div className="text-xs text-muted-foreground">
                  Total Entries
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href={`/app/${slug}/users/${user.id}/entries`}>
                  <SquareArrowOutUpRight className="text-muted-foreground" />
                </Link>
              </Button>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">
                {engagement}%
              </div>
              <div className="text-xs text-muted-foreground">
                Task Engagement
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
