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
import { InfoIcon, SaveIcon, RocketIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';
import { UnifiedFormAction } from '@/components/patterns/form-layout/types';

interface PickerPublishConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onContinueEditing: (fieldName?: string) => void;
  onCancel: () => void;
  onSave: () => void;
  onPublish: () => void;
  isUpdating: boolean;
  isPublishing: boolean;
  action: UnifiedFormAction;
}

export const PickerPublishConfirmationModal: React.FC<
  PickerPublishConfirmationModalProps
> = ({
  open,
  onClose,
  onCancel,
  onSave,
  onPublish,
  isUpdating,
  isPublishing,
  action
}) => {
  const isDemo = action === 'demo';

  const isLoading = isUpdating || isPublishing;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ready to Publish?</DialogTitle>
          <DialogDescription asChild>
            <div className="mt-1 space-y-3">
              {isDemo ? (
                <Alert variant="primary">
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Demo Mode:</strong> Publishing and saving are not
                    available in the demo. You can continue exploring the editor
                    or exit to learn more about pricing.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="info">
                  <InfoIcon />
                  <AlertTitle>
                    <strong>Note:</strong>
                  </AlertTitle>
                  <AlertDescription>
                    <span>
                      Once published, a picker will start synchronizing entries
                      from the connected source. This can{' '}
                      <strong>take a few hours</strong>. You will be notified{' '}
                      <strong>via email</strong> when the process is complete.
                    </span>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!isDemo && (
            <>
              <Button variant="outline" onClick={onSave} disabled={isLoading}>
                {isUpdating ? (
                  <>
                    <Spinner size="sm" />
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon className="h-4 w-4 mr-2" />
                    Save & Exit
                  </>
                )}
              </Button>
              <Button
                onClick={onPublish}
                disabled={isLoading}
                className="sm:ml-auto"
              >
                {isPublishing ? (
                  <>
                    <Spinner size="sm" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <RocketIcon className="h-4 w-4 mr-2" />
                    Publish
                  </>
                )}
              </Button>
            </>
          )}

          {isDemo && (
            <>
              <Button variant="outline" onClick={onCancel}>
                Continue Editing
              </Button>
              <div className="flex gap-2 sm:ml-auto">
                <Link href="/#pricing">
                  <Button variant="outline">Exit Demo</Button>
                </Link>
                <Link href="/login">
                  <Button>Sign Up</Button>
                </Link>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
