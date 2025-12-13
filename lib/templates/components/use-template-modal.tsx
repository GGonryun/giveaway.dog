'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GiveawayParticipation } from '@/components/sweepstakes/giveaway-participation';
import { toSweepstakesState } from '@/lib/sweepstakes';
import { TemplateListItemSchema } from '../schemas/template';
import { SAMPLE_SWEEPSTAKES_DATA } from '@/components/demo/sample-sweepstakes-data';
import {
  mockHost,
  mockParticipant,
  mockParticipation,
  mockPrizes,
  onFakeCompleteProfile,
  onFakeFormSubmit,
  onFakeLogin,
  onFakeTaskComplete
} from '@/components/sweepstakes-editor/data/mocks';

interface UseTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TemplateListItemSchema | null;
  onUse: (template: TemplateListItemSchema) => void;
}

export function UseTemplateModal({
  open,
  onOpenChange,
  template,
  onUse
}: UseTemplateModalProps) {
  if (!template) return null;

  const mockSweepstakes = {
    ...SAMPLE_SWEEPSTAKES_DATA,
    id: 'preview-template',
    status: 'RUNNING' as const,
    timing: {
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      timeZone: 'America/Los_Angeles'
    },
    ...template.content
  };

  const state = toSweepstakesState({
    sweepstakes: mockSweepstakes,
    prizes: mockPrizes,
    participant: mockParticipant
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] h-[95vh] sm:w-[80vw] sm:h-[80vh] max-w-[95vw] sm:max-w-[80vw] max-h-[95vh] sm:max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 gap-1 border-b shrink-0 ">
          <DialogTitle>{template.name}</DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto flex min-h-0">
          <GiveawayParticipation
            sweepstakes={mockSweepstakes}
            host={mockHost}
            prizes={mockPrizes}
            participation={mockParticipation}
            participant={mockParticipant}
            state={state}
            className="w-full"
            onTaskComplete={onFakeTaskComplete}
            onCompleteProfile={onFakeCompleteProfile}
            onLogin={onFakeLogin}
            onFormSubmit={onFakeFormSubmit}
            verifyEmail={false}
          />
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-background shrink-0 rounded-b-lg">
          <Button
            onClick={() => {
              onUse(template);
              onOpenChange(false);
            }}
            size="sm"
            className="w-full sm:w-auto"
          >
            Use Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
