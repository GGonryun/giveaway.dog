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
  Pencil
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

import {
  PICKER_STATUS_LABELS,
  PICKER_STATUS_DESCRIPTIONS
} from '@/lib/pickers/schemas/status';
import { cn } from '@/lib/utils';
import { PickerTwitterPreviewEmbed } from './picker-twitter-preview';
import { STATUS_COLORS, STATUS_ICONS } from '../themes/status';
import { PickerTypeLogo } from './picker-type-logo';
import { formatDistance } from 'date-fns';
import { useState } from 'react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { PickerWinnerSection } from './picker-winner-section';
import { PickerAuditLogSection } from './picker-audit-log-section';
import { PublicPickerSchema } from '../schemas/public-picker';
import { PickerRenameModal } from './picker-rename-modal';
import { renamePicker } from '../procedures/rename-picker';
import { useRouter } from 'next/navigation';
import {
  PickerActionType,
  PICKER_ACTION_TYPE_LABEL,
  PICKER_ACTION_TYPE_ICON
} from '../schemas/form';
import { widetype } from '@/lib/widetype';
import { PickerActionDisplay } from './picker-action-display';

interface PickerOverviewProps {
  picker: PublicPickerSchema;
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

export const PickerOverview: React.FC<PickerOverviewProps> = ({ picker }) => {
  const router = useRouter();
  const statusConfig = STATUS_COLORS[picker.status];
  const StatusIcon = STATUS_ICONS[picker.status];
  const [previewOpen, setPreviewOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

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

  const stats = {
    totalEntries: picker.data.actions.length,
    uniqueParticipants: picker.data.users.length,
    filteredEntries: 0,
    validEntries: 0
  };

  const handleRename = async (newName: string) => {
    const result = await renamePicker({
      pickerId: picker.id,
      name: newName
    });

    if (result.ok) {
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <PickerTypeLogo type={picker.type} size={6} />
              <h2 className="text-2xl font-bold">{picker.form.setup.name}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRenameOpen(true)}
                className="h-8 w-8 p-0"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Post
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
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={picker.form.setup.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  prefetch={false}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open on X
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border">
            <div className={cn('mt-0.5', statusConfig.text)}>
              <StatusIcon
                className={cn(
                  'h-6 w-6',
                  picker.status === 'PROCESSING' ? 'animate-spin' : ''
                )}
              />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">
                  {PICKER_STATUS_LABELS[picker.status]}
                </p>
                <Badge variant={statusConfig.badge}>
                  {PICKER_STATUS_LABELS[picker.status]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {PICKER_STATUS_DESCRIPTIONS[picker.status]}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Total Entries"
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
      />

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
