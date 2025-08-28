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
import { AlertTriangleIcon, InfoIcon, CheckIcon, SaveIcon, ExternalLinkIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FieldError } from 'react-hook-form';

interface FormError {
  field: string;
  message: string;
  section?: string;
}

interface PrePublishValidationModalProps {
  open: boolean;
  onClose: () => void;
  onContinueEditing: (fieldName?: string) => void;
  onSaveDraft: () => void;
  onPublishConfirm: () => void;
  errors: FormError[];
  isLoading?: boolean;
  giveawayName: string;
}

export const PrePublishValidationModal: React.FC<PrePublishValidationModalProps> = ({
  open,
  onClose,
  onContinueEditing,
  onSaveDraft,
  onPublishConfirm,
  errors,
  isLoading = false,
  giveawayName
}) => {
  const hasErrors = errors.length > 0;

  const handleFixError = (error: FormError) => {
    onContinueEditing(error.field);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className={hasErrors ? "text-destructive" : "text-foreground"}>
            {hasErrors ? (
              <div className="flex items-center gap-2">
                <AlertTriangleIcon className="h-5 w-5" />
                Can't Publish Yet
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckIcon className="h-5 w-5" />
                Ready to Publish?
              </div>
            )}
          </DialogTitle>
          <DialogDescription>
            {hasErrors 
              ? `${errors.length} issue${errors.length > 1 ? 's' : ''} need to be fixed before "${giveawayName}" can be published`
              : `Your giveaway "${giveawayName}" will be published and go live immediately`
            }
          </DialogDescription>
        </DialogHeader>

        {hasErrors ? (
          <>
            <Alert>
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <div className="font-medium">Issues to fix:</div>
                  <div className="space-y-2">
                    {errors.map((error, index) => (
                      <div key={index} className="flex items-start justify-between gap-3 p-2 bg-muted/50 rounded">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">{error.message}</div>
                          {error.section && (
                            <div className="text-xs text-muted-foreground">in {error.section}</div>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleFixError(error)}
                          className="flex-shrink-0"
                        >
                          <ExternalLinkIcon className="h-3 w-3 mr-1" />
                          Fix
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => onContinueEditing()}
                disabled={isLoading}
              >
                Continue Editing
              </Button>
              <Button 
                onClick={onSaveDraft}
                disabled={isLoading}
                className="sm:ml-auto"
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div>
                    <strong>Free during beta!</strong> Publishing normally consumes 1 token, 
                    but you have unlimited tokens while we're in beta.
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Once published, your giveaway will be live and participants can start entering.
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={onSaveDraft}
                disabled={isLoading}
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button 
                onClick={onPublishConfirm}
                disabled={isLoading}
                className="sm:ml-auto"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Publish Now
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};