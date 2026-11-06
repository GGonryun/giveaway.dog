import { HelpCircleIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@giveaway/ui-primitives/dialog';
export type HelpDialogProps = {
  title: string;
  description?: string;
  content: React.ReactNode;
};
export const HelpDialog: React.FC<HelpDialogProps> = ({
  title,
  description,
  content
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={title}
          className="rounded-full cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <HelpCircleIcon
            aria-hidden="true"
            className="h-4 w-4 text-primary-foreground bg-primary rounded-full"
          />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="text-sm font-normal text-muted-foreground">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
};
