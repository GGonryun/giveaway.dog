'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ExternalLink,
  Calendar,
  Users,
  Trophy,
  Filter,
  CheckCircle2,
  XCircle,
  Activity,
  Eye,
  Pencil,
  Share2,
  Clock
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

import {
  PICKER_STATUS_LABELS,
  PICKER_STATUS_DESCRIPTIONS
} from '@/lib/pickers/schemas/status';
import { cn } from '@/lib/utils';
import { PickerTwitterPreviewEmbed } from './picker-twitter-preview';
import { STATUS_COLORS, STATUS_ICONS } from '../themes/status';
import { PickerTypeLogo } from './picker-type-logo';
import { formatDistance, format } from 'date-fns';
import React, { useState } from 'react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { PickerWinnerSection } from './picker-winner-section';
import { PickerAuditLogSection } from './picker-audit-log-section';
import { PickerJobsSection } from './picker-jobs-section';
import {
  getDisqualificationReason,
  PublicPickerSchema
} from '../schemas/public-picker';
import { PickerRenameModal } from './picker-rename-modal';
import { renamePicker } from '../procedures/rename-picker';
import { useRouter } from 'next/navigation';
import { widetype } from '@/lib/widetype';
import { PickerActionDisplay } from './picker-action-display';
import { useProcedure } from '@/lib/mrpc/hook';
import { completePicker } from '../procedures/complete-picker';
import { toast } from 'sonner';
import { Lock, Loader2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface PickerOverviewProps {
  picker: PublicPickerSchema;
  teamSlug: string;
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

export const PickerOverview: React.FC<PickerOverviewProps> = ({
  picker,
  teamSlug
}) => {
  const router = useRouter();
  const statusConfig = STATUS_COLORS[picker.status];
  const StatusIcon = STATUS_ICONS[picker.status];
  const [renameOpen, setRenameOpen] = useState(false);

  const completeProcedure = useProcedure({
    action: completePicker,
    onSuccess() {
      toast.success(
        'Picker marked as complete! No further changes can be made.'
      );
      router.refresh();
    },
    onFailure(error) {
      toast.error(
        error.message || 'Failed to complete picker. Please try again.'
      );
    }
  });

  const activeActions = widetype
    .entries(picker.form.actions)
    .filter(([_, value]) => value)
    .map(([key]) => key);

  const activeFilters = Object.entries(picker.form.filters)
    .filter(([_, value]) => value !== null && value !== undefined)
    .map(([key, value]) => ({ key, value }));

  const activeRequirements = Object.entries(picker.form.requirements)
    .filter(([_, value]) => value)
    .map(([key]) => key);

  const stats = picker.stats;
  const hasWinners = picker.draws.draws.some(
    (draw) => draw.result === 'WINNER'
  );
  const isProcessedWithWinners = picker.status === 'PROCESSED' && hasWinners;

  const handleRename = async (newName: string) => {
    const result = await renamePicker({
      pickerId: picker.id,
      name: newName
    });

    if (result.ok) {
      router.refresh();
    }
  };

  const handleCompletePicker = () => {
    completeProcedure.run({ pickerId: picker.id });
  };

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <PickerTypeLogo type={picker.type} className="size-4 sm:size-6" />
              <h2 className="text-xl sm:text-2xl font-bold">
                {picker.form.setup.name}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRenameOpen(true)}
                className="size-4 sm:size-6"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <PickerOverviewMenu picker={picker} hasWinners={hasWinners} />
          </div>

          <div
            className={cn(
              'flex items-start gap-4 p-4 rounded-lg border',
              isProcessedWithWinners
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-muted/50'
            )}
          >
            <div
              className={cn(
                'mt-0.5',
                isProcessedWithWinners ? 'text-green-600' : statusConfig.text
              )}
            >
              {isProcessedWithWinners ? (
                <Trophy className="h-6 w-6" />
              ) : (
                <StatusIcon
                  className={cn(
                    'h-6 w-6',
                    picker.status === 'PROCESSING' ? 'animate-spin' : ''
                  )}
                />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <p className="font-semibold">
                  {isProcessedWithWinners
                    ? 'All Winners Chosen!'
                    : PICKER_STATUS_LABELS[picker.status]}
                </p>
                <Badge
                  variant={
                    isProcessedWithWinners ? 'default' : statusConfig.badge
                  }
                  className={cn(
                    isProcessedWithWinners &&
                      'bg-green-600 hover:bg-green-700 text-white'
                  )}
                >
                  {isProcessedWithWinners
                    ? 'Winners Selected'
                    : PICKER_STATUS_LABELS[picker.status]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {isProcessedWithWinners
                  ? 'Winners have been drawn and are ready to be announced. Mark as complete once all participants have verified and received their prize.'
                  : PICKER_STATUS_DESCRIPTIONS[picker.status]}
                {picker.status === 'PROCESSING' &&
                  picker.form.timing?.scheduledAt && (
                    <span className="block mt-1 text-orange-600 dark:text-orange-400">
                      Scheduled to begin processing{' '}
                      {formatDistance(
                        new Date(picker.form.timing.scheduledAt),
                        new Date(),
                        { addSuffix: true }
                      )}
                    </span>
                  )}
              </p>
              {isProcessedWithWinners && (
                <div className="pt-1">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleCompletePicker}
                    disabled={completeProcedure.isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {completeProcedure.isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Mark as Complete
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
              label="Valid Entries"
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

          <Separator />

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
                  {picker.form.timing?.scheduledAt && (
                    <InfoRow
                      icon={Clock}
                      label="Scheduled Start"
                      value={
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge
                                variant="secondary"
                                className="cursor-help bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:hover:bg-orange-900"
                              >
                                {formatDistance(
                                  new Date(picker.form.timing.scheduledAt),
                                  new Date(),
                                  { addSuffix: true }
                                )}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-mono">
                                {format(
                                  new Date(picker.form.timing.scheduledAt),
                                  'MMM d, yyyy HH:mm:ss'
                                )}
                                {picker.form.timing.timeZone && (
                                  <span className="ml-1">
                                    ({picker.form.timing.timeZone})
                                  </span>
                                )}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      }
                    />
                  )}
                  <InfoRow
                    icon={Trophy}
                    label="Winners"
                    value={picker.form.winners.quota}
                    valueClassName="text-primary"
                  />
                  <InfoRow
                    icon={ExternalLink}
                    label="Post URL"
                    value={
                      <a
                        href={picker.form.setup.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-xs truncate max-w-[200px] block"
                      >
                        {new URL(picker.form.setup.postUrl).pathname}
                      </a>
                    }
                  />
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
                      {activeFilters.map(({ key, value }) => (
                        <div
                          key={key}
                          className="text-xs flex justify-between items-center"
                        >
                          <span className="text-muted-foreground">
                            {key === 'minimumPostCount' && 'Min Posts'}
                            {key === 'minimumAccountAgeDays' &&
                              'Min Account Age'}
                            {key === 'minimumFollowers' && 'Min Followers'}
                            {key === 'minimumFollowing' && 'Min Following'}
                          </span>
                          <span className="font-medium">
                            {value}
                            {key === 'minimumAccountAgeDays' && ' days'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeRequirements.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                      Profile Requirements
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {activeRequirements.map((req) => (
                        <Badge key={req} variant="outline" className="text-xs">
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

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Required Actions
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {activeActions.length > 0 ? (
                  activeActions.map((action) => (
                    <Badge key={action} variant="secondary" className="text-xs">
                      <PickerActionDisplay action={action} size="sm" />
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No actions required
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <PickerWinnerSection
        pickerId={picker.id}
        pickerName={picker.form.setup.name}
        status={picker.status}
        numberOfWinners={picker.form.winners.quota}
        teamSlug={teamSlug}
        draws={picker.draws.draws}
        stats={{
          validEntries: stats.validEntries
        }}
      />

      {picker.jobs && picker.jobs.length > 0 && (
        <PickerJobsSection jobs={picker.jobs} />
      )}

      {picker.logs && picker.logs.length > 0 && (
        <PickerAuditLogSection logs={picker.logs} />
      )}

      <PickerRenameModal
        open={renameOpen}
        onOpenChange={setRenameOpen}
        currentName={picker.form.setup.name}
        pickerId={picker.id}
        onRename={handleRename}
      />
    </div>
  );
};

const PickerOverviewMenu: React.FC<{
  picker: PublicPickerSchema;
  hasWinners: boolean;
}> = ({ picker, hasWinners }) => {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <div className="block sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon-sm">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setPreviewOpen(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview Post
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={picker.form.setup.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                prefetch={false}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open on X
              </Link>
            </DropdownMenuItem>
            {hasWinners && (
              <DropdownMenuItem asChild>
                <Link
                  href={`/draws/${picker.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Results
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle>Post Preview</DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-6">
              <PickerTwitterPreviewEmbed
                postUrl={picker.form.setup.postUrl}
                className="border rounded-lg px-2"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="hidden sm:flex items-center gap-2">
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 sm:w-auto p-0 sm:px-3 [&_svg]:mr-0"
            >
              <Eye className="h-4 w-4 mr-2" />
              <span className="hidden lg:inline">Preview Post</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle>Post Preview</DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-6">
              <PickerTwitterPreviewEmbed
                postUrl={picker.form.setup.postUrl}
                className="border rounded-lg px-2"
              />
            </div>
          </DialogContent>
        </Dialog>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 sm:w-auto p-0 sm:px-3 [&_svg]:mr-0"
          asChild
        >
          <Link
            href={picker.form.setup.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            prefetch={false}
          >
            <ExternalLink />
            <span className="hidden lg:inline">Open on X</span>
          </Link>
        </Button>
        {hasWinners && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 sm:w-auto p-0 sm:px-3 [&_svg]:mr-0"
            asChild
          >
            <Link
              href={`/draws/${picker.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Share2 className="h-4 w-4 mr-2" />
              <span className="hidden lg:inline">Share Results</span>
            </Link>
          </Button>
        )}
      </div>
    </>
  );
};
