'use client';

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
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  Users,
  Gem,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import pluralize from 'pluralize';
import { useState } from 'react';
import { TwitterV2ParticipantsTable } from './twitter-v2-participants-table';
import { TwitterV2PickerUserSchema } from '../schemas/details';
import Link from 'next/link';

const PAGE_SIZE = 10;

export const TwitterV2ParticipantsSection = ({
  participants,
  isUnverified = false,
  totalCount
}: {
  participants: TwitterV2PickerUserSchema[];
  isUnverified?: boolean;
  totalCount?: number;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showFiltered, setShowFiltered] = useState(false);
  const [page, setPage] = useState(1);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const eligible = participants.filter((p) => !p.ineligible);
  const filteredParticipants = showFiltered ? participants : eligible;
  const displayCount =
    isUnverified && totalCount ? totalCount : eligible.length;

  const totalPages = Math.ceil(filteredParticipants.length / PAGE_SIZE);
  const paginated = filteredParticipants.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const handleNext = () => {
    if (isUnverified) {
      setShowUpgradeModal(true);
    } else {
      setPage((p) => Math.min(p + 1, totalPages));
    }
  };

  const handleFilterToggle = (checked: boolean) => {
    if (isUnverified && checked) {
      setShowUpgradeModal(true);
      return;
    }
    setShowFiltered(checked);
    setPage(1);
  };

  return (
    <>
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
                    <span className="sm:hidden">{displayCount}</span>
                    <span className="hidden sm:inline">
                      {displayCount} {pluralize('participant', displayCount)}
                    </span>
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
              <div className="border rounded-lg overflow-hidden">
                <TwitterV2ParticipantsTable participants={paginated} />
              </div>
              {(totalPages > 1 || isUnverified) && (
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={!isUnverified && page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gem className="h-5 w-5 text-primary" />
              Unlock Full Participant History
            </DialogTitle>
            <DialogDescription className="pt-2">
              The host used a free picker, which limits participation details to
              the first page. Upgrade to PRO or ask the host to do so to see
              complete results.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowUpgradeModal(false)}
              className="w-full sm:w-auto"
            >
              Maybe Later
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/pricing">
                <Gem className="h-4 w-4 mr-2" />
                Upgrade to PRO
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
