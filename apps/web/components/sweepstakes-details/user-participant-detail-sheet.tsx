'use client';

import React, { useEffect, useState } from 'react';

import {
  MapPin,
  Calendar,
  Eye,
  ChevronRight,
  ExternalLinkIcon,
  Award
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useTeams } from '../context/team-provider';
import { Badge } from '@giveaway/ui-primitives/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@giveaway/ui-primitives/sheet';
import { Button } from '@giveaway/ui-primitives/button';
import Link from 'next/link';
import { StatusExplanationDialog } from '../users/status-explanation-dialog';
import { Separator } from '@giveaway/ui-primitives/separator';
import { datetime } from '@giveaway/util-time/date';
import { cn } from '@giveaway/ui-utils/utils';
import {
  toQualityType,
  QUALITY_LABELS
} from '@giveaway/user-quality-model/quality';
import { QUALITY_BADGE_VARIANT } from '@/lib/user-quality/display';
import { UserProviders } from '@/lib/integrations/components/user-providers';
import { UserStatusBadge } from '@/lib/user/components/user-status-badge';
import { SweepstakesParticipantSchema } from '@/lib/participant/schemas';
import { UNKNOWN_USER_NAME } from '@giveaway/app-config/settings';
import { toMostRecentCompletion } from '@/lib/task/completions';
import { toSweepstakesEngagement, toTwitterLink } from '@/lib/participant/db';
import { SweepstakesFormFieldSchema } from '@giveaway/custom-fields-model/schemas';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { ObfuscatedEmail } from '@giveaway/ui-primitives/obfuscated-email';

export const UserParticipantSheetContent: React.FC<{
  participant: SweepstakesParticipantSchema | null;
  totalTasks: number | null;
  fields: SweepstakesFormFieldSchema[];
}> = ({ participant, totalTasks, fields }) => {
  const router = useRouter();
  const { activeTeam } = useTeams();
  const [showStatusDialog, setShowStatusDialog] = useState(false);

  if (!participant) return null;

  const lastEntryAt = toMostRecentCompletion(participant.completions);
  const engagement = toSweepstakesEngagement(
    participant.completions,
    totalTasks
  );

  const twitterLink = toTwitterLink(fields, participant.formValues);

  return (
    <>
      <SheetHeader className="pb-0">
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <SheetTitle className="flex items-center gap-2">
              <span className="text-2xl text-primary font-bold">
                {participant.user.name ?? UNKNOWN_USER_NAME}
              </span>
            </SheetTitle>
            <SheetDescription className="flex items-center space-x-2">
              <ObfuscatedEmail email={participant.user.email} />
            </SheetDescription>
            <div className="my-2">
              <UserProviders providers={participant.user.providers} />
            </div>
          </div>
        </div>
      </SheetHeader>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-xl font-bold">
              {participant.completions.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Entries</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-xl font-bold text-blue-600">{engagement}%</div>
            <div className="text-sm text-muted-foreground">Engagement</div>
          </div>
          <div className="flex items-center justify-center p-3 bg-muted rounded-lg">
            <UserStatusBadge status={'active'} />
          </div>
        </div>

        <Separator />

        {/* User Details Header and Basic Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-medium">User Details</h4>
              <Badge
                variant={
                  QUALITY_BADGE_VARIANT[
                    toQualityType(participant.user.qualityScore)
                  ]
                }
              >
                {QUALITY_LABELS[toQualityType(participant.user.qualityScore)]}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mr-1 w-32"
              onClick={() => {
                router.push(
                  `/app/${activeTeam.slug}/users/${participant.user.id}/overview`
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
              <span>{participant.user.countryCode}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Joined on {datetime.format(participant.user.createdAt, 'short')}
              </span>
            </div>
            {lastEntryAt && (
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Last entry was {datetime.format(lastEntryAt, 'short')}
                </span>
              </div>
            )}
            {twitterLink && (
              <div className="flex items-center space-x-2 text-sm">
                <SocialXIcon className="h-4 w-4 text-muted-foreground" />
                <a
                  href={twitterLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary hover:underline"
                >
                  {twitterLink}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Allocation Section */}
        {participant.allocation && (
          <div className="space-y-2">
            <h4 className="text-base font-medium">Prize Allocation</h4>
            <div className="rounded-lg border bg-muted p-4">
              <div className="flex items-center space-x-3">
                <Award className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">
                    {participant.allocation.prize.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Selected Prize
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-medium">Recent Entries</h4>
            <Button
              variant="ghost"
              size="sm"
              className="mr-1 w-32"
              onClick={() => {
                router.push(
                  `/app/${activeTeam.slug}/users/${participant.user.id}/overview`
                );
              }}
            >
              <Eye />
              See Entries
            </Button>
          </div>
          <div className="space-y-2">
            {participant.completions.slice(0, 8).map((completion) => (
              <div
                key={completion.task.id}
                className="rounded-lg border bg-muted hover:bg-accent/50 transition-colors overflow-hidden group"
              >
                <Link
                  href={`/app/${activeTeam.slug}/sweepstakes/${completion.sweepstake.id}/entries/task/${completion.task.id}?active=${completion.id}`}
                  target="_blank"
                >
                  <div className="flex items-start justify-between p-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium group-hover:underline">
                        {completion.task.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {completion.sweepstake.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {completion.completedAt
                          ? datetime.format(completion.completedAt, 'short')
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
            {participant.completions.length === 0 && (
              <div className="rounded-lg border bg-card p-4 text-center text-muted-foreground">
                No entries yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Action Button */}
      <div className="border-t pt-4 mt-4 shrink-0">
        <Button size="sm" className="w-full" asChild>
          <Link href={`/app/${activeTeam.slug}/users/${participant.user.id}`}>
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
        status="active"
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
  participant: SweepstakesParticipantSchema | null;
  totalTasks: number | null;
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
}> = ({ participant, totalTasks, open, onOpenChangeAction }) => {
  return (
    <ParticipatingUserSheetLayout open={open} onOpenChange={onOpenChangeAction}>
      {Boolean(participant && totalTasks) && (
        <UserParticipantSheetContent
          participant={participant}
          totalTasks={totalTasks}
          fields={[]} // no sweepstakes field parsing is possible for user details
        />
      )}
    </ParticipatingUserSheetLayout>
  );
};
