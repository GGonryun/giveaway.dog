'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InfoIcon, SaveIcon, TrashIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { UnifiedFormAction } from '@/components/patterns/form-layout/types';
import { DEFAULT_TWITTER_V2_PICKER_NAME } from '../data/defaults';

interface TwitterV2CancelConfirmationModalProps {
  onClose: () => void;
  open: boolean;
  isLoading: boolean;
  action: UnifiedFormAction;
  onDiscard: () => void;
  onSave: () => void;
}

export const TwitterV2CancelConfirmationModal: React.FC<
  TwitterV2CancelConfirmationModalProps
> = ({ action, onClose, open, isLoading, onDiscard, onSave }) => {
  return (
    <Dialog open={Boolean(open)} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>You're exiting the Picker Editor</DialogTitle>
          <DialogDescription>
            You have unsaved changes to "{DEFAULT_TWITTER_V2_PICKER_NAME}". What
            would you like to do?
          </DialogDescription>
        </DialogHeader>

        {action === 'demo' && (
          <Alert variant="primary">
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>Demo Mode:</strong> Saving and deleting are not available
              in the demo. You can continue editing or exit to return.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Continue Editing
          </Button>

          {action !== 'demo' && (
            <div className="flex gap-2 sm:ml-auto">
              <Button
                variant="destructive"
                onClick={onDiscard}
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                {action === 'edit' ? 'Discard Changes' : 'Delete Draft'}
              </Button>

              <Button
                onClick={onSave}
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                Save & Exit
              </Button>
            </div>
          )}

          {action === 'demo' && (
            <div className="flex gap-2 sm:ml-auto">
              <Link href="/#pricing">
                <Button variant="outline">Exit Demo</Button>
              </Link>
              <Link href="/login">
                <Button>Sign Up</Button>
              </Link>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
