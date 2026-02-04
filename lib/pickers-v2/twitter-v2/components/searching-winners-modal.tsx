'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface SearchingWinnersModalProps {
  open: boolean;
}

export const SearchingWinnersModal: React.FC<SearchingWinnersModalProps> = ({
  open
}) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-center">
            Searching for Winners
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground text-center">
            Please wait while we analyze the post and select winners...
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
