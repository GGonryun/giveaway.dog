'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@giveaway/ui-primitives/card';
import { Badge } from '@giveaway/ui-primitives/badge';
import { Button } from '@giveaway/ui-primitives/button';
import {
  Calendar,
  Clock,
  Trophy,
  ExternalLink,
  Filter,
  Activity,
  Users,
  CheckCircle2,
  MoreVertical,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Ban,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  History,
  XCircle,
  Share2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@giveaway/ui-primitives/dropdown-menu';
import { format } from 'date-fns/format';
import { formatDistance } from 'date-fns/formatDistance';
import { isFuture } from 'date-fns/isFuture';
import {
  PICKER_STATUS_LABELS,
  PICKER_STATUS_DESCRIPTIONS
} from '@giveaway/picker-model/schemas/status';
import { TwitterV2PickerSchema } from '@giveaway/x-picker-model/schemas/details';
import { TwitterScrapeProgressMonitor } from '@giveaway/x-picker-editor/twitter-scrape-progress-monitor';
import { Separator } from '@giveaway/ui-primitives/separator';
import { cn } from '@giveaway/ui-utils/utils';
import { STATUS_COLORS, STATUS_ICONS } from '@giveaway/picker-ui/themes/status';
import { shouldShowProgress } from '@giveaway/picker-model/utils/status';
import Link from 'next/link';
import { extractTweetId } from '@giveaway/x-picker-model/extract-tweet-id';
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@giveaway/ui-primitives/avatar';
import { TwitterV2DeleteConfirmationModal } from '@giveaway/x-picker-editor/twitter-v2-delete-confirmation-modal';
import { DrawExtraWinnerModal } from './twitter-v2-draw-extra-winner-modal';
import { DisqualifyWinnerModal } from './twitter-v2-disqualify-winner-modal';
import { DisqualificationReasonModal } from './twitter-v2-disqualification-reason-modal';
import { deleteTwitterV2Picker } from '@giveaway/x-picker-server/procedures/delete-twitter-v2-picker';
import { drawTwitterV2Picker } from '@giveaway/x-picker-server/procedures/draw-twitter-v2-picker';
import { disqualifyTwitterV2Winner } from '@giveaway/x-picker-server/procedures/disqualify-twitter-v2-winner';

import { SocialXIcon } from '@giveaway/integration-icons/x-icon';
import { TwitterV2ParticipantsSection } from './twitter-v2-participants-section';

interface TwitterV2PickerOverviewProps {
  picker: TwitterV2PickerSchema;
  slug: string;
}

const InfoRow = ({
  icon: Icon,
  label,
  value,
  valueClassName
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) => (
  <div className="flex items-center justify-between py-1.5">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </div>
    <div className={cn('text-sm font-medium', valueClassName)}>{value}</div>
  </div>
);

const StatCard = ({
  label,
  value,
  icon: Icon,
  iconClassName
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  iconClassName?: string;
}) => (
  <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
    <div className={cn('p-2 rounded-md', iconClassName)}>
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  </div>
);

export const TwitterV2PickerOverview: React.FC<
  TwitterV2PickerOverviewProps
> = ({ picker, slug }) => {
  const router = useRouter();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [drawExtraModalOpen, setDrawExtraModalOpen] = useState(false);
  const [disqualifyModalOpen, setDisqualifyModalOpen] = useState(false);
  const [disqualifyDrawId, setDisqualifyDrawId] = useState<string | null>(null);
  const [disqualifyWinnerName, setDisqualifyWinnerName] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDisqualifying, setIsDisqualifying] = useState(false);
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [reasonModalData, setReasonModalData] = useState<{
    winnerName: string;
    reason: string;
  } | null>(null);
  const [drawHistoryExpanded, setDrawHistoryExpanded] = useState(false);

  const activeFilters = [
    picker.minPostCount !== null && {
      key: 'minimumPostCount',
      value: picker.minPostCount
    },
    picker.minAccountAgeDays !== null && {
      key: 'minimumAccountAgeDays',
      value: picker.minAccountAgeDays
    },
    picker.minFollowersCount !== null && {
      key: 'minimumFollowers',
      value: picker.minFollowersCount
    },
    picker.minFollowingCount !== null && {
      key: 'minimumFollowing',
      value: picker.minFollowingCount
    }
  ].filter(Boolean);

  const activeRequirements = [
    picker.requireProfileImage && 'hasProfileImage',
    picker.requireBannerImage && 'hasBanner',
    picker.requireLocation && 'hasLocation',
    picker.requireBio && 'hasDescription'
  ].filter(Boolean);

  const eligibleUsers = picker.users.filter((u) => !u.ineligible);

  const stats = {
    totalEntries: picker.users.length,
    uniqueParticipants: picker.users.length,
    validEntries: eligibleUsers.length,
    filteredEntries: picker.users.length - eligibleUsers.length
  };

  const handleDeletePicker = async () => {
    setIsDeleting(true);
    try {
      await deleteTwitterV2Picker({ pickerId: picker.id });
      router.push(`/app/${slug}/pickers`);
    } catch (error) {
      console.error('Failed to delete picker:', error);
      setIsDeleting(false);
    }
  };

  const handleDrawWinners = async (count?: number) => {
    setIsDrawing(true);
    try {
      await drawTwitterV2Picker({ pickerId: picker.id, count });
      router.refresh();
    } catch (error) {
      console.error('Failed to draw winners:', error);
    } finally {
      setIsDrawing(false);
    }
  };

  const handleDrawExtra = () => {
    setDrawExtraModalOpen(true);
  };

  const confirmDrawExtra = async () => {
    setDrawExtraModalOpen(false);
    await handleDrawWinners(1);
  };

  const handleDisqualify = (drawId: string, winnerName: string) => {
    setDisqualifyDrawId(drawId);
    setDisqualifyWinnerName(winnerName);
    setDisqualifyModalOpen(true);
  };

  const confirmDisqualify = async (reason: string) => {
    if (!disqualifyDrawId) return;
    setIsDisqualifying(true);
    try {
      await disqualifyTwitterV2Winner({ drawId: disqualifyDrawId, reason });
      await handleDrawWinners(1);
      setDisqualifyModalOpen(false);
      setDisqualifyDrawId(null);
      setDisqualifyWinnerName('');
    } catch (error) {
      console.error('Failed to disqualify winner:', error);
    } finally {
      setIsDisqualifying(false);
    }
  };

  const handleShowReason = (winnerName: string, reason: string) => {
    setReasonModalData({ winnerName, reason });
    setReasonModalOpen(true);
  };

  const hasDrawn = picker.draws && picker.draws.length > 0;
  const activeWinners = picker.draws?.filter((d) => !d.disqualified) || [];
  const drawHistory = picker.draws || [];

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <SocialXIcon className="h-5 w-5 sm:h-6 sm:w-6" />
              <h2 className="text-xl sm:text-2xl font-bold">X Picker</h2>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/app/${slug}/pickers/x/${picker.id}/edit`}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Picker
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/pickers/x/${picker.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Draw Verification
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteModalOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Picker
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <PickerStatusSection
            picker={picker}
            slug={slug}
            onDraw={handleDrawWinners}
            isDrawing={isDrawing}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Total Actions"
              value={stats.totalEntries}
              icon={Activity}
              iconClassName="bg-blue-500/10 text-blue-500"
            />
            <StatCard
              label="Participants"
              value={stats.uniqueParticipants}
              icon={Users}
              iconClassName="bg-purple-500/10 text-purple-500"
            />
            <StatCard
              label="Eligible"
              value={stats.validEntries}
              icon={CheckCircle2}
              iconClassName="bg-green-500/10 text-green-500"
            />
            <StatCard
              label="Filtered Out"
              value={stats.filteredEntries}
              icon={XCircle}
              iconClassName="bg-red-500/10 text-red-500"
            />
          </div>
        </CardContent>
      </Card>

      {hasDrawn && activeWinners.length > 0 && (
        <WinnersSection
          winners={activeWinners}
          picker={picker}
          onDrawExtra={handleDrawExtra}
          onDisqualify={handleDisqualify}
          isDrawing={isDrawing}
        />
      )}

      <Card className="border-2">
        <CardContent className="space-y-6">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              <div className="space-y-4 flex-1">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Picker Details
                </h3>
                <div className="space-y-0">
                  <InfoRow
                    icon={Calendar}
                    label="Created"
                    value={formatDistance(picker.createdAt, new Date(), {
                      addSuffix: true
                    })}
                  />
                  {picker.runAt && isFuture(picker.runAt) && (
                    <InfoRow
                      icon={Clock}
                      label="Scheduled"
                      value={format(picker.runAt, 'MMM d, yyyy h:mm a')}
                      valueClassName="text-orange-500"
                    />
                  )}
                  <InfoRow
                    icon={Trophy}
                    label="Winners"
                    value={picker.winners}
                    valueClassName="text-primary"
                  />
                  {picker.tweetUrls.length > 0 && (
                    <div className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Tweets</span>
                      </div>
                      <div className="flex gap-1">
                        {picker.tweetUrls.map((url, index) => {
                          const tweetId = extractTweetId(url);
                          return tweetId ? (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline px-1.5 py-0.5 rounded bg-primary/10"
                            >
                              {tweetId}
                            </a>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="hidden md:block w-px bg-border self-stretch" />
              <Separator className="md:hidden" orientation="horizontal" />

              <div className="space-y-4 flex-1">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters & Requirements
                </h3>

                {activeFilters.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                      Account Filters
                    </h4>
                    <div className="space-y-1">
                      {activeFilters.map(
                        (filter) =>
                          filter && (
                            <div
                              key={filter.key}
                              className="text-xs flex justify-between items-center"
                            >
                              <span className="text-muted-foreground">
                                {filter.key === 'minimumPostCount' &&
                                  'Min Posts'}
                                {filter.key === 'minimumAccountAgeDays' &&
                                  'Min Account Age'}
                                {filter.key === 'minimumFollowers' &&
                                  'Min Followers'}
                                {filter.key === 'minimumFollowing' &&
                                  'Min Following'}
                              </span>
                              <span className="font-medium">
                                {filter.value}
                                {filter.key === 'minimumAccountAgeDays' &&
                                  ' days'}
                              </span>
                            </div>
                          )
                      )}
                    </div>
                  </div>
                )}

                {activeRequirements.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                      Profile Requirements
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {activeRequirements.map((req, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {req === 'hasProfileImage' && 'Profile Image'}
                          {req === 'hasBanner' && 'Banner'}
                          {req === 'hasLocation' && 'Location'}
                          {req === 'hasDescription' && 'Bio'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {activeFilters.length === 0 &&
                  activeRequirements.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      No filters or requirements configured
                    </span>
                  )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <TwitterV2ParticipantsSection participants={picker.users} />

      {drawHistory.length > 0 && (
        <DrawHistorySection
          draws={drawHistory}
          picker={picker}
          expanded={drawHistoryExpanded}
          onToggle={() => setDrawHistoryExpanded(!drawHistoryExpanded)}
          onShowReason={handleShowReason}
        />
      )}

      <DrawExtraWinnerModal
        open={drawExtraModalOpen}
        onOpenChange={setDrawExtraModalOpen}
        onConfirm={confirmDrawExtra}
        isLoading={isDrawing}
      />

      <DisqualifyWinnerModal
        open={disqualifyModalOpen}
        onOpenChange={setDisqualifyModalOpen}
        onConfirm={confirmDisqualify}
        isLoading={isDisqualifying}
        winnerName={disqualifyWinnerName}
      />

      <DisqualificationReasonModal
        open={reasonModalOpen}
        onOpenChange={setReasonModalOpen}
        winnerName={reasonModalData?.winnerName}
        reason={reasonModalData?.reason}
      />

      <TwitterV2DeleteConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleDeletePicker}
        isLoading={isDeleting}
      />
    </div>
  );
};

interface PickerStatusSectionProps extends TwitterV2PickerOverviewProps {
  onDraw: (count?: number) => void;
  isDrawing: boolean;
}

const PickerStatusSection: React.FC<PickerStatusSectionProps> = ({
  picker,
  onDraw,
  isDrawing
}) => {
  const showProgress = shouldShowProgress(picker.status);
  const statusConfig = STATUS_COLORS[picker.status];
  const StatusIcon = STATUS_ICONS[picker.status];
  const hasDrawn = picker.draws && picker.draws.length > 0;

  if (showProgress) {
    return (
      <TwitterScrapeProgressMonitor
        pickerId={picker.id}
        runId={picker.runId}
        status={picker.status}
      />
    );
  }

  if (picker.status === 'COMPLETE' && !hasDrawn) {
    return (
      <Card className="border-green-500/50 bg-green-500/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-green-600">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Ready to Draw Winners
            </div>
            <p className="text-sm text-muted-foreground font-normal mt-2">
              {picker.winners} {picker.winners === 1 ? 'winner' : 'winners'}{' '}
              will be selected from{' '}
              {picker.users.filter((u) => !u.ineligible).length} eligible
              participants.
            </p>
          </CardTitle>
          <Button
            variant="success"
            onClick={() => onDraw()}
            disabled={isDrawing}
          >
            {isDrawing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trophy className="h-4 w-4 mr-2" />
            )}
            {isDrawing ? 'Drawing...' : 'Draw Winners'}
          </Button>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 rounded-lg border',
        'bg-muted/50'
      )}
    >
      <div className={cn('mt-0.5', statusConfig.text)}>
        <StatusIcon
          className={cn(
            'h-6 w-6',
            picker.status === 'PROCESSING' ? 'animate-spin' : ''
          )}
        />
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{PICKER_STATUS_LABELS[picker.status]}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          {PICKER_STATUS_DESCRIPTIONS[picker.status]}
        </p>
      </div>
    </div>
  );
};

interface WinnersSectionProps {
  winners: Array<{
    id: string;
    userId: string;
    disqualified: string | null;
  }>;
  picker: TwitterV2PickerSchema;
  onDrawExtra: () => void;
  onDisqualify: (drawId: string, winnerName: string) => void;
  isDrawing: boolean;
}

const WinnersSection: React.FC<WinnersSectionProps> = ({
  winners,
  picker,
  onDrawExtra,
  onDisqualify,
  isDrawing
}) => {
  const handleShare = () => {
    const winnerUsernames = winners
      .map((draw) => {
        const user = picker.users.find((u) => u.id === draw.userId);
        return user?.username;
      })
      .filter(Boolean);

    const winnersText =
      winnerUsernames.length === 1
        ? `@${winnerUsernames[0]}`
        : winnerUsernames.length === 2
          ? `@${winnerUsernames[0]} and @${winnerUsernames[1]}`
          : `${winnerUsernames
              .slice(0, -1)
              .map((u) => `@${u}`)
              .join(
                ', '
              )}, and @${winnerUsernames[winnerUsernames.length - 1]}`;

    const firstTweetId = picker.tweetUrls[0]
      ? extractTweetId(picker.tweetUrls[0])
      : null;

    const tweetText = `🎉 Congratulations to ${winnersText} for winning our giveaway!\n\n${window.location.origin}/pickers/x/${picker.id}`;

    const twitterUrl = firstTweetId
      ? `https://twitter.com/intent/tweet?in_reply_to=${firstTweetId}&text=${encodeURIComponent(tweetText)}`
      : `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="border-yellow-500/50 bg-yellow-500/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-yellow-600">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Winners ({winners.length})
          </div>
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Share</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDrawExtra}
            disabled={isDrawing}
          >
            {isDrawing ? (
              <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 sm:mr-2" />
            )}
            <span className="hidden sm:inline">Draw Extra</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 items-stretch">
          {winners.map((draw) => {
            const user = picker.users.find((u) => u.id === draw.userId);
            return user ? (
              <div
                key={draw.id}
                className="relative flex flex-col items-center gap-2 p-4 rounded-lg border bg-background min-h-45 max-h-60"
              >
                <button
                  onClick={() =>
                    onDisqualify(draw.id, user.name || user.username || '')
                  }
                  className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Re-roll winner"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.profileImageUrl ?? undefined} />
                  <AvatarFallback>
                    {(user.name || 'U').substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center w-full min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{user.username}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs mt-auto"
                  asChild
                >
                  <a
                    href={`https://x.com/${user.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </a>
                </Button>
              </div>
            ) : null;
          })}
        </div>
      </CardContent>
    </Card>
  );
};

interface DrawHistorySectionProps {
  draws: Array<{
    id: string;
    userId: string;
    disqualified: string | null;
    createdAt: Date;
  }>;
  picker: TwitterV2PickerSchema;
  expanded: boolean;
  onToggle: () => void;
  onShowReason: (winnerName: string, reason: string) => void;
}

const DrawHistorySection: React.FC<DrawHistorySectionProps> = ({
  draws,
  picker,
  expanded,
  onToggle,
  onShowReason
}) => {
  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <CardTitle>Draw History</CardTitle>
            <Badge variant="secondary">{draws.length}</Badge>
          </div>
          {expanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Drawn At
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {draws.map((draw) => {
                    const user = picker.users.find((u) => u.id === draw.userId);
                    const isDisqualified = !!draw.disqualified;
                    return user ? (
                      <tr key={draw.id} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={user.profileImageUrl ?? undefined}
                              />
                              <AvatarFallback>
                                {(user.name || 'U')
                                  .substring(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p
                                className={cn(
                                  'text-sm font-medium',
                                  isDisqualified &&
                                    'line-through text-muted-foreground'
                                )}
                              >
                                {user.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                @{user.username}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {format(draw.createdAt, 'MMM d, yyyy h:mm a')}
                        </td>
                        <td className="px-4 py-3">
                          {isDisqualified ? (
                            <Badge variant="destructive" className="gap-1">
                              <Ban className="h-3 w-3" />
                              Disqualified
                            </Badge>
                          ) : (
                            <Badge
                              variant="default"
                              className="gap-1 bg-yellow-500"
                            >
                              <Trophy className="h-3 w-3" />
                              Winner
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={`https://x.com/${user.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View
                              </a>
                            </Button>
                            {isDisqualified && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  onShowReason(
                                    user.name || user.username || '',
                                    draw.disqualified || ''
                                  )
                                }
                              >
                                View Reason
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : null;
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
