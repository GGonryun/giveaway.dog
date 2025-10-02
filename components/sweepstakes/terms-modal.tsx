'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import React from 'react';
import {
  stringifyTerms,
  SweepstakesTermOptions
} from '@/components/sweepstakes-editor/form/terms';
import { useGiveawayParticipation } from './giveaway-participation-context';
import { date } from '@/lib/date';

interface TermsModalProps {
  children: React.ReactNode;
}

export const TermsModal: React.FC<TermsModalProps> = ({ children }) => {
  const { sweepstakes } = useGiveawayParticipation();
  const terms = sweepstakes.terms;
  const [open, setOpen] = React.useState(false);

  const renderTermsContent = () => {
    if (terms.type === 'CUSTOM') {
      return (
        <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
          {terms.text}
        </div>
      );
    }

    // Generate eligibility regions text based on restrictions
    const getEligibilityRegions = () => {
      if (!sweepstakes.audience.regionalRestriction) return 'Global';

      const regions = sweepstakes.audience.regionalRestriction.regions;
      const filter = sweepstakes.audience.regionalRestriction.filter;

      if (filter === 'INCLUDE') {
        return `to residents of: ${regions.join(', ')}`;
      } else {
        return `globally (excluding: ${regions.join(', ')})`;
      }
    };

    // Generate full terms using the existing stringifyTerms function
    const termOptions: SweepstakesTermOptions = {
      sweepstakesName: sweepstakes.setup.name,
      eligibilityRegions: getEligibilityRegions(),
      eligibilityAge: sweepstakes.audience.minimumAgeRestriction
        ? `${sweepstakes.audience.minimumAgeRestriction.value}`
        : undefined,
      startDate: date.format(sweepstakes.timing.startDate, 'long'),
      endDate: date.format(sweepstakes.timing.endDate, 'long'),
      entryUrl: typeof window !== 'undefined' ? window.location.href : '',
      prizes: sweepstakes.prizes.map((prize) => ({
        name: prize.name,
        quota: prize.quota
      })),
      ...terms
    };

    const fullTerms = stringifyTerms(termOptions);

    return (
      <div className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
        {fullTerms}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Terms & Conditions</DialogTitle>
          <DialogDescription>
            Please read the following terms and conditions for this sweepstakes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>{renderTermsContent()}</div>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setOpen(false)} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
