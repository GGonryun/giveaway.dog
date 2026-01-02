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
import { TemplateListItemSchema } from '../schemas/template';
import { SAMPLE_SWEEPSTAKES_DATA } from '@/components/demo/sample-sweepstakes-data';
import {
  mockHost,
  mockParticipant,
  mockParticipation,
  mockPrizes,
  mockUserReferral,
  onFakeCompleteProfile,
  onFakeCreateReferral,
  onFakeFormSubmit,
  onFakeLogin,
  onFakeTaskComplete,
  onFakeTurnstileVerify
} from '@/components/sweepstakes-editor/data/mocks';
import { SparklesIcon, Edit, Loader2, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { GiveawaySchema } from '@/schemas/giveaway/schemas';
import {
  DEFAULT_DESIGN_DATA,
  DEFAULT_SWEEPSTAKES_DESIGN
} from '@/schemas/giveaway/defaults';

interface UseTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TemplateListItemSchema | null;
  onUse: (template: TemplateListItemSchema) => void;
  onCustomize: (template: TemplateListItemSchema) => void;
  onEdit?: (template: TemplateListItemSchema) => void;
}

export function UseTemplateModal({
  open,
  onOpenChange,
  template,
  onUse,
  onCustomize,
  onEdit
}: UseTemplateModalProps) {
  const [isEditLoading, setIsEditLoading] = useState(false);

  if (!template) return null;

  const {
    isCustom,
    template: {
      template: { name, description },
      ...templateFields
    }
  } = template;

  const mockSweepstakes = {
    design: DEFAULT_DESIGN_DATA,
    audience: SAMPLE_SWEEPSTAKES_DATA.audience,
    visibility: SAMPLE_SWEEPSTAKES_DATA.visibility,
    terms: SAMPLE_SWEEPSTAKES_DATA.terms,
    criteria: SAMPLE_SWEEPSTAKES_DATA.criteria,
    tasks: [],
    prizes: [],
    ...templateFields,
    status: 'RUNNING' as const,
    timing: {
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      timeZone: 'America/Los_Angeles'
    }
  } as GiveawaySchema;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] h-[95vh] sm:w-[95vw] sm:h-[95vh] max-w-[95vw] sm:max-w-[95vw] max-h-[95vh] sm:max-h-[95vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 gap-1 border-b shrink-0 ">
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto flex min-h-0">
          <GiveawayParticipation
            sweepstakes={mockSweepstakes}
            host={mockHost}
            prizes={mockPrizes}
            participation={mockParticipation}
            participant={mockParticipant}
            state={'active'}
            className="w-full"
            referral={mockUserReferral}
            onCreateReferral={onFakeCreateReferral}
            onTaskComplete={onFakeTaskComplete}
            onCompleteProfile={onFakeCompleteProfile}
            onLogin={onFakeLogin}
            onFormSubmit={onFakeFormSubmit}
            onTurnstileVerify={onFakeTurnstileVerify}
            verifyEmail={false}
          />
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-background shrink-0 rounded-b-lg gap-2">
          {isCustom ? (
            <Button
              onClick={() => {
                setIsEditLoading(true);
                onEdit?.(template);
              }}
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isEditLoading}
            >
              {isEditLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Edit className="mr-2" />
              )}
              {isEditLoading ? 'Loading...' : 'Edit Template'}
            </Button>
          ) : (
            <Button
              onClick={() => {
                onCustomize(template);
                onOpenChange(false);
              }}
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
            >
              <SparklesIcon className="mr-2" />
              Customize Template
            </Button>
          )}
          <Button
            onClick={() => {
              onUse(template);
              onOpenChange(false);
            }}
            size="sm"
            className="w-full sm:w-auto"
          >
            Use Template <ArrowRight />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
