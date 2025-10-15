'use client';

import React, { useEffect, useState } from 'react';

import {
  MapPin,
  Calendar,
  Activity,
  Eye,
  ChevronRight,
  BarChart3,
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
import { devices, userAgent } from '@/lib/devices';
import {
  USER_AGENT_DEVICE_ICON,
  USER_AGENT_DEVICE_LABEL
} from '@/schemas/user-agent';
import { Separator } from '../ui/separator';
import { datetime } from '@/lib/date';

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
      <SheetHeader>
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <SheetTitle className="text-xl">{user.name}</SheetTitle>
            <SheetDescription className="flex items-center space-x-2">
              <span>{user.email}</span>
              {getStatusBadge(user.status)}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-xl font-bold">{user.entries.length}</div>
            <div className="text-sm text-muted-foreground">Total Entries</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">
              {user.engagement}%
            </div>
            <div className="text-sm text-muted-foreground">Engagement</div>
          </div>
        </div>

        <Separator />

        {/* User Details Header and Basic Info */}
        <div className="space-y-3">
          <h4 className="text-base font-medium">User Details</h4>

          {/* Basic Info */}
          <div className="space-y-3">
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

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-medium">Device & Browser</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                router.push(`/app/${activeTeam.slug}/users/${user.id}/devices`);
              }}
            >
              <Eye />
              View Details
            </Button>
          </div>
          <div className="space-y-3">
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

        {/* Quality Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-medium">Quality Score</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                router.push(`/app/${activeTeam.slug}/users/${user.id}/risk`);
              }}
            >
              <BarChart3 />
              View Breakdown
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div
                className={`text-2xl font-bold ${
                  user.qualityScore >= 80
                    ? 'text-green-600'
                    : user.qualityScore >= 60
                      ? 'text-yellow-600'
                      : user.qualityScore >= 40
                        ? 'text-orange-600'
                        : 'text-red-600'
                }`}
              >
                {user.qualityScore}
              </div>
              <div className="text-muted-foreground">/100</div>
            </div>
            <div className="flex-1 bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  user.qualityScore >= 80
                    ? 'bg-green-500'
                    : user.qualityScore >= 60
                      ? 'bg-yellow-500'
                      : user.qualityScore >= 40
                        ? 'bg-orange-500'
                        : 'bg-red-500'
                }`}
                style={{ width: `${user.qualityScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Recent Entries */}
        <div className="space-y-3 pb-4">
          <h4 className="text-base font-medium">Recent Entries</h4>
          <div className="space-y-2">
            {user.entries.slice(0, 8).map((entry) => (
              <div
                key={entry.taskId}
                className="p-3 bg-muted/30 rounded group hover:bg-muted/50 transition-colors"
              >
                <Link
                  href={`/app/${activeTeam.slug}/sweepstakes/${entry.sweepstakeId}/entries/task/${entry.taskId}?active=${entry.completionId}`}
                  target="_blank"
                >
                  <div className="flex items-start justify-between">
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
                        className="group-hover:opacity-100 opacity-0 transition-opacity cursor-pointer"
                      >
                        <ExternalLinkIcon />
                      </Button>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
            {user.entries.length === 0 && (
              <div className="p-3 bg-muted/30 rounded text-center text-muted-foreground">
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
  root: 'participants' | 'entries';
}> = ({ slug, sweepstakesId, root, children }) => {
  const router = useRouter();
  const userId = useUserIdFromPath(
    root === 'participants'
      ? /\/participants\/([^/]+)/
      : /\/entries\/user\/([^/]+)/
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
