import { HelpCircleIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/dialog';
export type HelpDialogProps = {
  title: string;
  description?: string;
  content: React.ReactNode;
};
export const HelpDialog: React.FC<HelpDialogProps> = ({ title, content }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <HelpCircleIcon className="h-4 w-4 text-primary-foreground bg-primary rounded-full" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="text-sm font-normal text-muted-foreground">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
};
