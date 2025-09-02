import { Button } from '@/components/ui/button';
import {
  AlertCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from 'lucide-react';
import { useFormFooterNavigation } from '@/components/sweepstakes-editor/hooks/use-form-footer-navigation';
import { cn } from '@/lib/utils';
import { useFormIssuesDialog } from './hooks/use-form-issues-dialog';
import { useSweepstakes } from './hooks/use-sweepstake-step';
import { useMemo } from 'react';
import pluralize from 'pluralize';
import { FormIssuesDialog } from './form-issues-dialog';

export const UnifiedFormFooter: React.FC = () => {
  const { step: currentStep, mobile } = useSweepstakes();
  const { hasNextStep, hasPreviousStep, handleNext, handlePrevious } =
    useFormFooterNavigation();
  const { open, errors, onOpenChange, onJumpToField } =
    useFormIssuesDialog(currentStep);

  const totalErrors = useMemo(() => errors.length, [errors]);
  const isValid = useMemo(() => totalErrors === 0, [totalErrors]);

  return (
    <div className="bg-background border-t p-3">
      <div className="flex justify-between items-center">
        <FormIssuesDialog
          open={open}
          errors={errors}
          onOpenChange={onOpenChange}
          onJumpToField={onJumpToField}
          trigger={
            !!totalErrors ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  mobile
                    ? 'flex items-center gap-1'
                    : 'flex items-center gap-2',
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
            type="button"
            variant={isValid ? 'default' : 'outline'}
            size="sm"
            onClick={handleNext}
            disabled={!hasNextStep}
          >
            Next
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
