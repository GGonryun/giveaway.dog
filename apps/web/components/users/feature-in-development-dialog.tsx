'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@giveaway/ui-primitives/dialog';
import { Button } from '@giveaway/ui-primitives/button';
import { Rocket, Settings, MessageCircle } from 'lucide-react';

interface FeatureInDevelopmentDialogProps {
  open: boolean;
  onClose: () => void;
  featureName?: string;
}

export const FeatureInDevelopmentDialog = ({
  open,
  onClose,
  featureName = 'This feature'
}: FeatureInDevelopmentDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <DialogTitle>Feature In Active Development</DialogTitle>
          </div>
          <DialogDescription className="pt-4 space-y-4">
            <p>
              {featureName} is currently being actively developed and will be
              available soon.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-sm">
                <Settings className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <p>
                  You can request early access from your{' '}
                  <span className="font-medium">
                    Account &gt; Feature Flags
                  </span>{' '}
                  section
                </p>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <MessageCircle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <p>
                  Or contact our support team to learn more about this feature
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={onClose}>Got it</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
