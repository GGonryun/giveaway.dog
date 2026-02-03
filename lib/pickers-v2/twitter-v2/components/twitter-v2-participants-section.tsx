'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { ChevronDown, Users } from 'lucide-react';
import pluralize from 'pluralize';
import { useState } from 'react';
import { TwitterV2ParticipantsTable } from './twitter-v2-participants-table';
import { TwitterV2PickerUserSchema } from '../schemas/details';

export const TwitterV2ParticipantsSection = ({
  participants
}: {
  participants: TwitterV2PickerUserSchema[];
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showFiltered, setShowFiltered] = useState(false);
  const eligible = participants.filter((p) => !p.ineligible);
  const filteredParticipants = showFiltered ? participants : eligible;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 hover:bg-transparent"
            >
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Participants
                <Badge variant="secondary" className="ml-2">
                  {eligible.length} {pluralize('participant', eligible.length)}
                </Badge>
              </CardTitle>

              <ChevronDown
                className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  isOpen && 'rotate-180'
                )}
              />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-3 mt-2">
            <div className="flex items-center justify-end mb-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-filtered"
                  checked={showFiltered}
                  onCheckedChange={setShowFiltered}
                />
                <Label
                  htmlFor="show-filtered"
                  className="text-sm cursor-pointer"
                >
                  Show Filtered Users
                </Label>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <TwitterV2ParticipantsTable participants={filteredParticipants} />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
