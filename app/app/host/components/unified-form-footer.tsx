import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  AlertCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from 'lucide-react';
import { useFormFooterNavigation } from '@/components/hooks/use-form-footer-navigation';
import { cn } from '@/lib/utils';

interface FieldIssuesDialogProps {
  errors: any[];
  incompleteFields: any[];
  onJumpToField: (fieldPath: string) => void;
  mobile?: boolean;
}

const FieldIssuesDialog: React.FC<FieldIssuesDialogProps> = ({
  errors,
  incompleteFields,
  onJumpToField,
  mobile = false
}) => {
  return (
    <DialogContent className={mobile ? 'max-w-sm mx-2' : 'max-w-md'}>
      <DialogHeader>
        <DialogTitle>Field Issues</DialogTitle>
      </DialogHeader>
      <div
        className={`space-y-4 overflow-y-auto ${mobile ? 'max-h-80' : 'max-h-96'}`}
      >
        {errors.length > 0 && (
          <div>
            <h4 className="font-medium text-destructive mb-2">
              Validation Errors
            </h4>
            <div className="space-y-2">
              {errors.map((error, index) => (
                <button
                  key={index}
                  onClick={() => onJumpToField(error.path)}
                  className="w-full text-left p-2 border rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium text-sm">{error.path}</div>
                  <div className="text-xs text-muted-foreground">
                    {error.message}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {incompleteFields.length > 0 && (
          <div>
            <h4 className="font-medium text-amber-600 mb-2">
              Incomplete Fields
            </h4>
            <div className="space-y-2">
              {incompleteFields.map((field, index) => (
                <button
                  key={index}
                  onClick={() => onJumpToField(field.path)}
                  className="w-full text-left p-2 border rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium text-sm">{field.path}</div>
                  <div className="text-xs text-muted-foreground">
                    This field is empty
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {errors.length === 0 && incompleteFields.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            All fields are complete and valid!
          </div>
        )}
      </div>
    </DialogContent>
  );
};

interface UnifiedFormFooterProps {
  mobile?: boolean;
}

export const UnifiedFormFooter: React.FC<UnifiedFormFooterProps> = ({
  mobile = false
}) => {
  const {
    dialogOpen,
    setDialogOpen,
    formErrors,
    incompleteFields,
    totalIssues,
    hasNextStep,
    hasPreviousStep,
    isValid,
    handleNext,
    handlePrevious,
    handleJumpToField
  } = useFormFooterNavigation();

  return (
    <div className="bg-background border-t p-3">
      <div className="flex justify-between items-center">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            {!totalIssues ? (
              <div />
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  mobile
                    ? 'flex items-center gap-1'
                    : 'flex items-center gap-2',
                  totalIssues > 0 &&
                    'bg-destructive text-destructive-foreground hover:bg-destructive/80 hover:text-destructive-foreground/90'
                )}
              >
                <AlertCircleIcon className="h-4 w-4" />
                {totalIssues > 0
                  ? `${totalIssues} Issue${totalIssues === 1 ? '' : 's'}`
                  : 'All Complete'}
              </Button>
            )}
          </DialogTrigger>
          <FieldIssuesDialog
            errors={formErrors}
            incompleteFields={incompleteFields}
            onJumpToField={handleJumpToField}
            mobile={mobile}
          />
        </Dialog>

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
