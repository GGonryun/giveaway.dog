'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { PickerFilterSettingsDialog } from './picker-filter-settings-dialog';
import { PickerUserDetailModal } from './picker-user-detail-modal';
import { PickerActions, PickerFilterSettings } from '../schemas/models';
import { Card } from '@/components/ui/card';

interface PickerUser {
  id: string;
  pickerId: string;
  twitterUserId: string;
  twitterUsername: string;
  twitterDisplayName: string;
  twitterProfileImageUrl: string | null;
  isVerifiedUser: boolean;
  isBlacklisted: boolean;
  totalEntries: number;
  likeCount: number;
  retweetCount: number;
  quoteCount: number;
  replyCount: number;
  filteredEntries: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

interface PickerParticipantsProps {
  participants: PickerUser[];
  actions: PickerActions;
  filters: PickerFilterSettings;
  showFiltered: boolean;
}

export const PickerParticipants: React.FC<PickerParticipantsProps> = ({
  participants,
  actions,
  filters,
  showFiltered: initialShowFiltered
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showFiltered, setShowFiltered] = useState(initialShowFiltered);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PickerUser | null>(null);

  const filteredParticipants = showFiltered
    ? participants
    : participants.filter((p) => !p.isBlacklisted && p.filteredEntries === 0);

  const handleToggleFiltered = (checked: boolean) => {
    setShowFiltered(checked);
    const params = new URLSearchParams(searchParams);
    if (checked) {
      params.set('showFiltered', 'true');
    } else {
      params.delete('showFiltered');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSaveFiltersAndActions = (
    newFilters: PickerFilterSettings,
    newActions: PickerActions
  ) => {
    console.log('Saving filters:', newFilters);
    console.log('Saving actions:', newActions);
    setFilterDialogOpen(false);
  };

  const validEntries = (participant: PickerUser) =>
    participant.totalEntries - participant.filteredEntries;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">Participants</h3>
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-filtered"
                  checked={showFiltered}
                  onCheckedChange={handleToggleFiltered}
                />
                <Label
                  htmlFor="show-filtered"
                  className="text-sm cursor-pointer"
                >
                  Show Filtered Users
                </Label>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredParticipants.length}{' '}
              {showFiltered ? 'total' : 'eligible'} participants
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterDialogOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Filter Settings & Requirements
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Total Entries</TableHead>
                <TableHead className="text-right">Valid</TableHead>
                <TableHead className="text-right">Filtered</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParticipants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      No participants found
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredParticipants.map((participant) => (
                  <TableRow
                    key={participant.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedUser(participant)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {participant.twitterProfileImageUrl ? (
                          <img
                            src={participant.twitterProfileImageUrl}
                            alt={participant.twitterDisplayName}
                            className="h-8 w-8 rounded-full"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {participant.twitterDisplayName
                              .substring(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {participant.twitterDisplayName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{participant.twitterUsername}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium">
                        {participant.totalEntries}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-green-600">
                        {validEntries(participant)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-muted-foreground">
                        {participant.filteredEntries}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {participant.isBlacklisted ? (
                        <Badge variant="destructive">Blacklisted</Badge>
                      ) : participant.filteredEntries > 0 ? (
                        <Badge variant="secondary">Filtered</Badge>
                      ) : (
                        <Badge variant="default">Eligible</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <PickerFilterSettingsDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        filters={filters}
        actions={actions}
        onSave={handleSaveFiltersAndActions}
      />

      {selectedUser && (
        <PickerUserDetailModal
          user={selectedUser}
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
        />
      )}
    </>
  );
};
