'use client';

import React, { useEffect, useState } from 'react';

import {
  MapPin,
  Calendar,
  Activity,
  Eye,
  ChevronRight,
  Smartphone,
  BarChart3,
  Monitor,
  Tablet,
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
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import Link from 'next/link';
import { StatusExplanationDialog } from '../users/status-explanation-dialog';
import { SweepstakesParticipantSchema } from '@/schemas/giveaway/participant';

export const ParticipatingUserSheetContent: React.FC<{
  user: SweepstakesParticipantSchema;
}> = ({ user }) => {
  const router = useRouter();
  const { activeTeam } = useTeams();
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  // Helper function to get additional details for display
  const getDisplayData = (user: SweepstakesParticipantSchema) => ({
    ...user,
    avatar: null,
    joinedAt: '2024-03-15T10:30:00Z', // TODO: Add to schema when available
    location: user.country,
    timezone: 'PST', // TODO: Add to schema when available
    totalEntries: user.entries.length,
    totalWins: 0, // TODO: Calculate from entries
    lifetimeValue: 0, // TODO: Calculate when available

    // Quality score breakdown
    qualityBreakdown: {
      emailVerified: user.emailVerified,
      disposableEmail: false, // TODO: Add when available
      deviceFingerprint: 'fp_abc123xyz', // TODO: Add when available
      engagement: user.engagement
    }
  });

  // Helper function to parse user agent for cleaner display
  const parseUserAgent = (userAgent: string | undefined) => {
    let deviceType = 'Desktop';
    let os = 'Unknown OS';
    let browser = 'Unknown Browser';

    // Handle undefined or null userAgent
    if (!userAgent) {
      return { deviceType, os, browser };
    }

    // Detect device type and OS
    if (userAgent.includes('iPhone')) {
      deviceType = 'Mobile';
      const iosMatch = userAgent.match(/OS (\d+)_(\d+)/);
      os = iosMatch ? `iOS ${iosMatch[1]}.${iosMatch[2]}` : 'iOS';
    } else if (userAgent.includes('iPad')) {
      deviceType = 'Tablet';
      const iosMatch = userAgent.match(/OS (\d+)_(\d+)/);
      os = iosMatch ? `iPadOS ${iosMatch[1]}.${iosMatch[2]}` : 'iPadOS';
    } else if (userAgent.includes('Android')) {
      deviceType = userAgent.includes('Mobile') ? 'Mobile' : 'Tablet';
      const androidMatch = userAgent.match(/Android (\d+\.?\d*)/);
      os = androidMatch ? `Android ${androidMatch[1]}` : 'Android';
    } else if (userAgent.includes('Windows')) {
      deviceType = 'Desktop';
      if (userAgent.includes('Windows NT 10.0')) os = 'Windows 10/11';
      else if (userAgent.includes('Windows NT 6.3')) os = 'Windows 8.1';
      else if (userAgent.includes('Windows NT 6.1')) os = 'Windows 7';
      else os = 'Windows';
    } else if (userAgent.includes('Mac OS X')) {
      deviceType = 'Desktop';
      const macMatch = userAgent.match(/Mac OS X (\d+)_(\d+)/);
      os = macMatch ? `macOS ${macMatch[1]}.${macMatch[2]}` : 'macOS';
    } else if (userAgent.includes('Linux')) {
      deviceType = 'Desktop';
      os = 'Linux';
    }

    // Detect browser
    if (userAgent.includes('Chrome') && !userAgent.includes('Chromium')) {
      const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
      browser = chromeMatch ? `Chrome ${chromeMatch[1]}` : 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      const firefoxMatch = userAgent.match(/Firefox\/(\d+)/);
      browser = firefoxMatch ? `Firefox ${firefoxMatch[1]}` : 'Firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      const safariMatch = userAgent.match(/Version\/(\d+)/);
      browser = safariMatch ? `Safari ${safariMatch[1]}` : 'Safari';
    } else if (userAgent.includes('Edge')) {
      const edgeMatch = userAgent.match(/Edge\/(\d+)/);
      browser = edgeMatch ? `Edge ${edgeMatch[1]}` : 'Edge';
    }

    return { deviceType, os, browser };
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  const displayData = getDisplayData(user);

  return (
    <>
      <SheetHeader>
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={displayData.avatar || undefined} />
            <AvatarFallback className="text-sm">
              {displayData.name
                ?.split(' ')
                .map((n) => n[0])
                .join('') || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <SheetTitle className="text-xl">{displayData.name}</SheetTitle>
            <SheetDescription className="flex items-center space-x-2">
              <span>{displayData.email}</span>
              {getStatusBadge(displayData.status)}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-4 mt-4 pb-4 pr-1">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-xl font-bold">{displayData.totalEntries}</div>
            <div className="text-sm text-muted-foreground">Total Entries</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-xl font-bold text-green-600">
              {displayData.totalWins}
            </div>
            <div className="text-sm text-muted-foreground">Wins</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">
              {displayData.engagement}%
            </div>
            <div className="text-sm text-muted-foreground">Engagement</div>
          </div>
        </div>

        {/* User Details Header and Basic Info */}
        <div className="space-y-3">
          <h4 className="text-base font-medium border-b pb-2">User Details</h4>

          {/* Basic Info */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{displayData.location}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Joined {formatDate(displayData.joinedAt)}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span>Last entry {formatDate(displayData.lastEntryAt)}</span>
            </div>
          </div>
        </div>

        {/* Device & Browser Information */}
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
                const deviceInfo = parseUserAgent(displayData.userAgent);
                const DeviceIcon =
                  deviceInfo.deviceType === 'Mobile'
                    ? Smartphone
                    : deviceInfo.deviceType === 'Tablet'
                      ? Tablet
                      : Monitor;

                return (
                  <>
                    <DeviceIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">{deviceInfo.deviceType}</div>
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
                  displayData.qualityScore >= 80
                    ? 'text-green-600'
                    : displayData.qualityScore >= 60
                      ? 'text-yellow-600'
                      : displayData.qualityScore >= 40
                        ? 'text-orange-600'
                        : 'text-red-600'
                }`}
              >
                {displayData.qualityScore}
              </div>
              <div className="text-muted-foreground">/100</div>
            </div>
            <div className="flex-1 bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  displayData.qualityScore >= 80
                    ? 'bg-green-500'
                    : displayData.qualityScore >= 60
                      ? 'bg-yellow-500'
                      : displayData.qualityScore >= 40
                        ? 'bg-orange-500'
                        : 'bg-red-500'
                }`}
                style={{ width: `${displayData.qualityScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Recent Entries */}
        <div className="space-y-3 pb-4">
          <h4 className="text-base font-medium">Recent Entries</h4>
          <div className="space-y-2">
            {displayData.entries.slice(0, 8).map((entry) => (
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
                          ? formatDate(entry.completedAt.toISOString())
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
            {displayData.entries.length === 0 && (
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
