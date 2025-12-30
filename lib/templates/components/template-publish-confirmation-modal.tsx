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
import { CheckIcon, SaveIcon, AlertTriangleIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFormContext } from 'react-hook-form';
import { TemplateFormSchema } from '../schemas/template';
import { useMemo } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { UnifiedFormAction } from '@/components/patterns/form-layout/types';

interface TemplatePublishConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
  action: UnifiedFormAction;
  name: string;
}

export const TemplatePublishConfirmationModal: React.FC<
  TemplatePublishConfirmationModalProps
> = ({ open, onClose, onCancel, onSave, isSaving, action, name }) => {
  const form = useFormContext<TemplateFormSchema>();

  const isDraft = action === 'create';

  const hasErrors = useMemo(() => {
    return Object.keys(form.formState.errors).length > 0;
  }, [form.formState.errors]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              {isDraft ? 'Save Template?' : 'Update Template?'}
            </div>
          </DialogTitle>
          <DialogDescription className="text-left">
            {isDraft ? (
              <>Your template "{name}" will be saved and available for use.</>
            ) : (
              <>Your changes to "{name}" will be saved.</>
            )}
          </DialogDescription>
        </DialogHeader>

        {hasErrors && (
          <Alert variant="warning">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertDescription>
              <strong>Incomplete Template:</strong> This template has incomplete
              fields. You can still save it, but creating a sweepstakes from this
              template will require filling in the missing information.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Continue Editing
          </Button>
          <Button onClick={onSave} disabled={isSaving} className="sm:ml-auto">
            {isSaving ? (
              <>
                <Spinner size="sm" />
                Saving...
              </>
            ) : (
              <>
                {hasErrors ? (
                  <SaveIcon className="h-4 w-4 mr-2" />
                ) : (
                  <CheckIcon className="h-4 w-4 mr-2" />
                )}
                {isDraft ? 'Save Template' : 'Update Template'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
