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
import { AlertTriangleIcon, Trash2Icon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useProcedure } from '@/lib/mrpc/hook';
import { deleteTemplate } from '../procedures/delete-template';
import { DEFAULT_TEMPLATE_NAME } from '../defaults';
import { useRouter } from 'next/navigation';

interface DeleteTemplateModalProps {
  onClose: () => void;
  template: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export const DeleteTemplateModal: React.FC<DeleteTemplateModalProps> = ({
  onClose,
  template
}) => {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState('');

  const deleteTemplateProcedure = useProcedure({
    action: deleteTemplate,
    onSuccess: () => {
      toast.success('Template deleted successfully');
      router.refresh();
      onClose();
    },
    onFailure: (error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    }
  });

  const isConfirmDisabled = useMemo(() => {
    const name = template?.name || DEFAULT_TEMPLATE_NAME;
    return (
      confirmText.toLowerCase() !== name.toLowerCase() ||
      deleteTemplateProcedure.isLoading
    );
  }, [confirmText, template?.name, deleteTemplateProcedure.isLoading]);

  const handleConfirm = () => {
    setConfirmText('');
    if (!isConfirmDisabled && template) {
      deleteTemplateProcedure.run({
        templateId: template.id,
        slug: template.slug
      });
    }
  };

  const handleClose = () => {
    if (!deleteTemplateProcedure.isLoading) {
      setConfirmText('');
      onClose();
    }
  };

  if (!template) return null;

  return (
    <Dialog open={Boolean(template)} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangleIcon className="h-5 w-5" />
            Delete Template
          </DialogTitle>
          <DialogDescription>
            You are about to permanently delete the template "
            {template?.name || DEFAULT_TEMPLATE_NAME}".
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertDescription>
            This action cannot be undone. The template will be permanently
            deleted.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <label htmlFor="confirm-name" className="text-sm font-medium">
              Type '{template.name || DEFAULT_TEMPLATE_NAME}' to confirm
              deletion:
            </label>
            <input
              id="confirm-name"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={template.name || DEFAULT_TEMPLATE_NAME}
              disabled={deleteTemplateProcedure.isLoading}
              className="w-full mt-2 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={deleteTemplateProcedure.isLoading}
          >
            Cancel
          </Button>

          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="sm:ml-auto"
          >
            {deleteTemplateProcedure.isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2Icon className="h-4 w-4 mr-2" />
                Delete Template
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
