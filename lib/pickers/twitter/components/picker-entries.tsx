'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
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
import {
  PickerEntry,
  PickerFilterSettings
} from '../schemas/models';
import { format } from 'date-fns';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  PICKER_ACTION_TYPE_ICON,
  PICKER_ACTION_TYPE_LABEL,
  PickerActionsSchema
} from '../schemas/form';

interface PickerEntriesProps {
  entries: PickerEntry[];
  actions: PickerActionsSchema;
  filters: PickerFilterSettings;
  showFiltered: boolean;
}

export const PickerEntries: React.FC<PickerEntriesProps> = ({
  entries,
  showFiltered: initialShowFiltered
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showFiltered, setShowFiltered] = useState(initialShowFiltered);

  const filteredEntries = showFiltered
    ? entries
    : entries.filter((entry) => !entry.filtered);

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

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">Entries</h3>
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
                  Show Filtered Entries
                </Label>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredEntries.length} {showFiltered ? 'total' : 'valid'}{' '}
              entries
            </p>
          </div>
        </div>

        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      No entries found
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => {
                  const Icon = PICKER_ACTION_TYPE_ICON[entry.actionType];
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-xs">
                        {format(entry.timestamp, 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {entry.twitterProfileImage && (
                            <img
                              src={entry.twitterProfileImage}
                              alt={entry.twitterDisplayName}
                              className="h-8 w-8 rounded-full"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium">
                              {entry.twitterDisplayName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{entry.twitterUsername}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          <Icon className="mr-1" />
                          {PICKER_ACTION_TYPE_LABEL[entry.actionType]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {entry.filtered ? (
                          <Badge variant="secondary">Filtered</Badge>
                        ) : (
                          <Badge variant="default">Valid</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
};
