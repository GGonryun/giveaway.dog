'use client';

import React, { useEffect, useState } from 'react';

import {
  MapPin,
  Calendar,
  Activity,
  Eye,
  ChevronRight,
  ExternalLinkIcon
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useTeams } from '../context/team-provider';
import { Badge } from '../ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '../ui/sheet';
import { Button } from '../ui/button';
import Link from 'next/link';
import { StatusExplanationDialog } from '../users/status-explanation-dialog';
import { SweepstakesParticipantSchema } from '@/schemas/giveaway/participant';
import { userAgent } from '@/lib/devices';
import {
  USER_AGENT_DEVICE_ICON,
  USER_AGENT_DEVICE_LABEL
} from '@/schemas/user-agent';
import { Separator } from '../ui/separator';
import { datetime } from '@/lib/date';
import { cn } from '@/lib/utils';
import { toQualityTextColor, toQualityProgressColor } from '@/schemas/quality';
import { Progress } from '../ui/progress';
import { ProviderSchema } from '@/lib/integrations/schemas/providers';
import { UserProviders } from '@/lib/integrations/components/user-providers';

export const ParticipatingUserSheetContent: React.FC<{
  user: SweepstakesParticipantSchema;
}> = ({ user }) => {
  const router = useRouter();
  const { activeTeam } = useTeams();
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: 'default' as const, label: 'Active' },
      flagged: { variant: 'destructive' as const, label: 'Flagged' },
      blocked: { variant: 'secondary' as const, label: 'Blocked' },
      trusted: { variant: 'default' as const, label: 'Trusted' }
    };

    const config = variants[status as keyof typeof variants] || variants.active;

    return (
      <Badge
        variant={config.variant}
        className="cursor-pointer hover:opacity-80 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          setShowStatusDialog(true);
        }}
      >
        {config.label}
      </Badge>
    );
  };

  if (!user) return null;

  return (
    <>
      <SheetHeader className="pb-0">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <SheetTitle className="flex items-center gap-2">
              <span className="text-2xl text-primary font-bold">
                {user.name}
              </span>
            </SheetTitle>
            <SheetDescription className="flex items-center space-x-2">
              <span>{user.email}</span>
            </SheetDescription>
            <div className="my-2">
              <UserProviders providers={user.providers} />
            </div>
          </div>
        </div>
      </SheetHeader>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-xl font-bold">{user.entries.length}</div>
            <div className="text-sm text-muted-foreground">Total Entries</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-xl font-bold text-blue-600">
              {user.engagement}%
            </div>
            <div className="text-sm text-muted-foreground">Engagement</div>
          </div>
          <div className="flex items-center justify-center p-3 bg-muted rounded-lg">
            {getStatusBadge(user.status)}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-medium">Quality Score</h4>
            <Button
              variant="ghost"
              size="sm"
              className="mr-1 w-32"
              onClick={() => {
                router.push(`/app/${activeTeam.slug}/users/${user.id}/risk`);
              }}
            >
              <Eye />
              See Report
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <div
                className={cn(
                  'text-3xl font-bold',
                  toQualityTextColor(user.qualityScore)
                )}
              >
                {user.qualityScore}
              </div>
              <div className="text-muted-foreground">/100</div>
            </div>
            <Progress
              value={user.qualityScore}
              indicatorClassName={toQualityProgressColor(user.qualityScore)}
              className="h-2"
            />
          </div>
        </div>

        {/* User Details Header and Basic Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-medium">User Details</h4>
            <Button
              variant="ghost"
              size="sm"
              className="mr-1 w-32"
              onClick={() => {
                router.push(
                  `/app/${activeTeam.slug}/users/${user.id}/overview`
                );
              }}
            >
              <Eye />
              See Profile
            </Button>
          </div>

          {/* Basic Info */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{user.country}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Joined {datetime.format(user.createdAt, 'short')}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span>
                Last entry {datetime.format(user.lastEntryAt, 'short')}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-medium">Recent Devices</h4>
            <Button
              variant="ghost"
              size="sm"
              className="mr-1 w-32"
              onClick={() => {
                router.push(`/app/${activeTeam.slug}/users/${user.id}/devices`);
              }}
            >
              <Eye />
              See Devices
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-start space-x-2 text-sm">
              {(() => {
                const deviceInfo = userAgent.parse(user.userAgent);
                const label =
                  USER_AGENT_DEVICE_LABEL[deviceInfo.device] || 'Unknown';
                const DeviceIcon = USER_AGENT_DEVICE_ICON[deviceInfo.device];

                return (
                  <>
                    <DeviceIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">{label}</div>
                      <div className="text-muted-foreground text-xs">
                        {deviceInfo.os} • {deviceInfo.browser}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-medium">Recent Entries</h4>
            <Button
              variant="ghost"
              size="sm"
              className="mr-1 w-32"
              onClick={() => {
                router.push(
                  `/app/${activeTeam.slug}/users/${user.id}/overview`
                );
              }}
            >
              <Eye />
              See Entries
            </Button>
          </div>
          <div className="space-y-2">
            {user.entries.slice(0, 8).map((entry) => (
              <div
                key={entry.taskId}
                className="rounded-lg border bg-muted hover:bg-accent/50 transition-colors overflow-hidden group"
              >
                <Link
                  href={`/app/${activeTeam.slug}/sweepstakes/${entry.sweepstakeId}/entries/task/${entry.taskId}?active=${entry.completionId}`}
                  target="_blank"
                >
                  <div className="flex items-start justify-between p-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium group-hover:underline">
                        {entry.taskName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <Link
                          href={`/app/${activeTeam.slug}/sweepstakes/${entry.sweepstakeId}`}
                          className="underline hover:opacity-80 transition-opacity"
                        >
                          {entry.sweepstakeName}
                        </Link>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {entry.completedAt
                          ? datetime.format(entry.completedAt, 'short')
                          : 'No date'}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="default" className="text-xs">
                        Completed
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 m-0 hover:bg-transparent group-hover:opacity-100 opacity-0 transition-opacity cursor-pointer"
                      >
                        <ExternalLinkIcon />
                      </Button>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
            {user.entries.length === 0 && (
              <div className="rounded-lg border bg-card p-4 text-center text-muted-foreground">
                No entries yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Action Button */}
      <div className="border-t pt-4 mt-4 flex-shrink-0">
        <Button size="sm" className="w-full" asChild>
          <Link href={`/app/${activeTeam.slug}/users/${user.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            View Full Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>

      {/* Status Explanation Dialog */}
      <StatusExplanationDialog
        open={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        status={user?.status || 'active'}
      />
    </>
  );
};

const useUserIdFromPath = (regex: RegExp) => {
  const pathname = usePathname();
  const match = pathname.match(regex);
  return match ? match[1] : undefined;
};

export const ParticipatingUserSheet: React.PC<{
  slug: string;
  sweepstakesId: string;
  root: 'participants' | 'entries' | 'winners';
}> = ({ slug, sweepstakesId, root, children }) => {
  const router = useRouter();
  const userId = useUserIdFromPath(
    root === 'participants'
      ? /\/participants\/([^/]+)/
      : root === 'entries'
        ? /\/entries\/user\/([^/]+)/
        : /\/winners\/user\/([^/]+)/
  );
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(!!userId);
  }, [userId]);

  const handleClose = (status: boolean) => {
    if (!status) {
      setOpen(false);
      router.push(`/app/${slug}/sweepstakes/${sweepstakesId}/${root}`);
    }
  };

  return (
    <ParticipatingUserSheetLayout open={open} onOpenChange={handleClose}>
      {children}
    </ParticipatingUserSheetLayout>
  );
};

const ParticipatingUserSheetLayout: React.PC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ open, onOpenChange, children }) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-lg flex flex-col px-4 sm:px-6 pb-4"
      >
        {children}
      </SheetContent>
    </Sheet>
  );
};

export const UserDetailSheet: React.FC<{
  user: SweepstakesParticipantSchema | null;
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
}> = ({ user, open, onOpenChangeAction }) => {
  return (
    <ParticipatingUserSheetLayout open={open} onOpenChange={onOpenChangeAction}>
      {user && <ParticipatingUserSheetContent user={user} />}
    </ParticipatingUserSheetLayout>
  );
};
