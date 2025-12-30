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
import { SaveIcon, TrashIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { TemplateFormSchema } from '../schemas/template';
import { UnifiedFormAction } from '@/components/patterns/form-layout/types';

interface TemplateCancelConfirmationModalProps {
  onClose: () => void;
  open: boolean;
  isLoading: boolean;
  action: UnifiedFormAction;
  onDiscard: () => void;
  onSave: () => void;
}

export const TemplateCancelConfirmationModal: React.FC<
  TemplateCancelConfirmationModalProps
> = ({ action, onClose, open, isLoading, onDiscard, onSave }) => {
  const form = useFormContext<TemplateFormSchema>();

  const nameField = useWatch({
    control: form.control,
    name: 'template.name'
  });

  const templateName = useMemo(
    () => nameField || 'Untitled Template',
    [nameField]
  );

  return (
    <Dialog open={Boolean(open)} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>You're exiting the Template Editor</DialogTitle>
          <DialogDescription>
            You have unsaved changes to "{templateName}". What would you like to
            do?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Continue Editing
          </Button>

          <div className="flex gap-2 sm:ml-auto">
            <Button
              variant="destructive"
              onClick={onDiscard}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              {action === 'edit' ? 'Discard Changes' : 'Delete Template'}
            </Button>

            {action === 'create' && (
              <Button
                onClick={onSave}
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                Save & Exit
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
