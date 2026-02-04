import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { ChevronDown, Users, Gem } from 'lucide-react';
import pluralize from 'pluralize';
import { useState } from 'react';
import { PickerParticipantsTable } from './picker-participants-table';
import { EligibleTwitterUser } from '@/lib/integrations/schemas/api';
import Link from 'next/link';

export const ParticipantsSection = ({
  participants,
  isUnverified = false,
  totalCount
}: {
  participants: EligibleTwitterUser[];
  isUnverified?: boolean;
  totalCount?: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFiltered, setShowFiltered] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const eligible = participants.filter((p: any) => !p.ineligible);
  const filteredParticipants = showFiltered ? participants : eligible;
  const displayCount = isUnverified && totalCount ? totalCount : eligible.length;

  const handleFilterToggle = (checked: boolean) => {
    if (isUnverified) {
      setShowUpgradeModal(true);
    } else {
      setShowFiltered(checked);
    }
  };

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
                  {displayCount} {pluralize('participant', displayCount)}
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
                  onCheckedChange={handleFilterToggle}
                />
                <Label
                  htmlFor="show-filtered"
                  className="text-sm cursor-pointer"
                >
                  Show Filtered Users
                </Label>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden relative">
              {isUnverified ? (
                <div className="relative">
                  <div className="blur-[2px] pointer-events-none select-none">
                    <PickerParticipantsTable
                      participants={filteredParticipants.slice(0, 10)}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-background/85">
                    <div className="text-center p-6 max-w-md space-y-4">
                      <h3 className="text-xl font-bold text-foreground">
                        Unlock full participant history
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        The host used a free picker, which hides participation
                        details. Upgrade to PRO or ask the host to do so to see
                        complete results.
                      </p>
                      <Button asChild size="lg" className="mt-2">
                        <Link href="/pricing">
                          <Gem className="h-4 w-4 mr-2" />
                          Upgrade to PRO
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <PickerParticipantsTable participants={filteredParticipants} />
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>

      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gem className="h-5 w-5 text-primary" />
              Unlock Filtered Participants
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-4">
              <p>
                The host used a free picker, which doesn't include access to
                filtered participant details and reroll functionality.
              </p>
              <p>
                Upgrade to PRO or ask the host to upgrade to view which
                participants were filtered out and why, plus unlock the ability
                to reroll winners and manage disqualifications.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowUpgradeModal(false)}
            >
              Cancel
            </Button>
            <Button asChild>
              <Link href="/pricing">
                <Gem className="h-4 w-4 mr-2" />
                Upgrade to PRO
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Collapsible>
  );
};
