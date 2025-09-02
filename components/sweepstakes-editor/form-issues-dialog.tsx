import { cn } from '@/lib/utils';
import { ErrorMessage } from '../hooks/use-form-errors';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/dialog';
import { AlertTriangleIcon, SquareArrowOutUpRightIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { useSweepstakes } from './hooks/use-sweepstake-step';

export type FormIssuesDialogProps = {
  open: boolean;
  errors: ErrorMessage[];
  onOpenChange: (open: boolean) => void;
  onJumpToField: (fieldPath: string) => void;
  trigger?: React.ReactNode;
  footer?: React.ReactNode;
};

export const FormIssuesDialog: React.FC<FormIssuesDialogProps> = ({
  trigger,
  errors,
  open,
  footer,
  onOpenChange,
  onJumpToField
}) => {
  const { mobile, status } = useSweepstakes();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {Boolean(trigger) && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn(mobile ? 'overflow-y-auto max-h-80' : 'max-w-md')}
      >
        <DialogHeader className="text-destructive">
          <DialogTitle>
            <div className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5" />
              There are some problems
            </div>
          </DialogTitle>
          <DialogDescription className="text-left">
            {`${errors.length} issue${errors.length > 1 ? 's' : ''} need to be fixed before you can ${status === 'DRAFT' ? 'publish' : 'save changes'}`}
          </DialogDescription>
        </DialogHeader>
        <div className={'space-y-4'}>
          {errors.length > 0 && (
            <div className="flex flex-col gap-2">
              {errors.map((error, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => onJumpToField(error.path)}
                  size="lg"
                  className="w-full flex justify-between text-left m-0 p-0 h-14 bg-destructive/20 hover:bg-destructive/30 cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-sm text-destructive">
                      {error.path}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {error.message}
                    </div>
                  </div>
                  <SquareArrowOutUpRightIcon />
                </Button>
              ))}
            </div>
          )}
        </div>
        {footer}
      </DialogContent>
    </Dialog>
  );
};
