'use client';

import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { EligibleTwitterUser } from '@/lib/integrations/schemas/api';
import { PickerParticipantsTable } from './picker-participants-table';

interface PickerParticipantsProps {
  participants: EligibleTwitterUser[];
  showFiltered: boolean;
}

export const PickerParticipants: React.FC<PickerParticipantsProps> = ({
  participants,
  showFiltered: initialShowFiltered
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showFiltered, setShowFiltered] = useState(initialShowFiltered);

  const filteredParticipants = showFiltered
    ? participants
    : participants.filter((p) => !p.ineligible);

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
        </div>

        <Card className="overflow-hidden p-0">
          <PickerParticipantsTable participants={filteredParticipants} />
        </Card>
      </div>
    </>
  );
};
