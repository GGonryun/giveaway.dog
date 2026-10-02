import { Button } from '@/components/ui/button';
import {
  AlertCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Save,
  Rocket,
  SaveIcon
} from 'lucide-react';

import { cn } from '@/lib/utils';

import { useMemo } from 'react';
import pluralize from 'pluralize';
import { FormIssuesDialog } from './form-issues-dialog';
import { useUnifiedFormLayout } from './use-unified-form-layout';
import { useFormFooterNavigation } from './use-form-footer-navigation';
import { DialogFooter } from '@/components/ui/dialog';

export const UnifiedFormFooter: React.FC = () => {
  const {
    mobile,
    action,
    disabled,
    onJumpToField,
    showIssues,
    onSave,
    setShowIssues,
    formErrors
  } = useUnifiedFormLayout();
  const { hasNextStep, hasPreviousStep, handleNext, handlePrevious } =
    useFormFooterNavigation();

  const totalErrors = useMemo(() => formErrors.length, [formErrors]);
  const isValid = useMemo(() => totalErrors === 0, [totalErrors]);
  const isCreating = useMemo(() => action === 'create', [action]);

  return (
    <div className="bg-background border-t p-3">
      <div className="flex justify-between items-center">
        <FormIssuesDialog
          open={showIssues}
          errors={formErrors}
          onOpenChange={setShowIssues}
          onJumpToField={onJumpToField}
          trigger={
            !!totalErrors ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  'flex items-center',
                  mobile ? 'gap-1' : 'gap-2',
                  'bg-destructive text-destructive-foreground hover:bg-destructive/80 hover:text-destructive-foreground/90'
                )}
              >
                <AlertCircleIcon className="h-4 w-4" />
                {totalErrors} {pluralize('Issue', totalErrors)}
              </Button>
            ) : (
              <div />
            )
          }
          footer={
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between w-full">
              <Button
                variant="outline"
                onClick={() => setShowIssues(false)}
                disabled={disabled}
              >
                Continue Editing
              </Button>
              {action === 'create' && (
                <Button
                  onClick={onSave}
                  disabled={disabled}
                  className="flex-1 sm:flex-none"
                >
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Save & Exit
                </Button>
              )}
            </DialogFooter>
          }
        />

        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            disabled={!hasPreviousStep}
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Back
          </Button>
          <Button
            key={hasNextStep ? 'next' : 'submit'}
            type={hasNextStep ? 'button' : 'submit'}
            variant={isValid ? 'default' : 'outline'}
            size="sm"
            onClick={hasNextStep ? handleNext : undefined}
          >
            {hasNextStep ? (
              <>
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </>
            ) : isCreating ? (
              <>
                <Rocket className="h-4 w-4 mr-1" />
                Publish
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
