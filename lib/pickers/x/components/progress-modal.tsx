'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useEffect, useState } from 'react';

interface ProgressModalProps {
  open: boolean;
  estimatedDurationMs?: number;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  open,
  estimatedDurationMs
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      setProgress(0);
      return;
    }

    // Use estimated duration if provided, otherwise fallback to random 4-9 seconds
    const duration = estimatedDurationMs ?? Math.random() * 5000 + 4000;
    const maxProgress = 92;
    const intervalTime = 100;
    const steps = duration / intervalTime;
    const progressPerStep = maxProgress / steps;

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += progressPerStep * (0.5 + Math.random());
      if (currentProgress >= maxProgress) {
        currentProgress = maxProgress;
        clearInterval(interval);
      }
      setProgress(Math.min(currentProgress, maxProgress));
    }, intervalTime);

    return () => clearInterval(interval);
  }, [open, estimatedDurationMs]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-center">
            Searching for Winners
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground text-center">
            {progress < 89
              ? 'Analyzing post and fetching participants...'
              : 'Almost there! Finalizing results...'}
          </p>
          <p className="text-xs text-muted-foreground">
            {Math.round(progress)}%
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
