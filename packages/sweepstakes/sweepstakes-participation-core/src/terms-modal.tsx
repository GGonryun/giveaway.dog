'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@giveaway/ui-primitives/dialog';
import { Button } from '@giveaway/ui-primitives/button';
import React from 'react';
import {
  stringifyTerms,
  SweepstakesTermOptions,
  toEligibilityTermOptions
} from '@giveaway/sweepstakes-model/terms';
import { useGiveawayParticipation } from './giveaway-participation-context';
import { date } from '@giveaway/util-time/date';
import { MinimalTipTapPreview } from '@giveaway/ui-rich-text/minimal-tiptap-preview';

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
          <MinimalTipTapPreview content={terms.text} />
        </div>
      );
    }

    // Generate full terms using the existing stringifyTerms function
    const termOptions: SweepstakesTermOptions = {
      sweepstakesName: sweepstakes.setup.name,
      ...toEligibilityTermOptions(sweepstakes.audience),
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
