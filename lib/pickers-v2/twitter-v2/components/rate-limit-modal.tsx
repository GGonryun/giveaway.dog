'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface RateLimitModalProps {
  open: boolean;
  onClose: () => void;
  retryAfterSeconds: number;
}

export const RateLimitModal: React.FC<RateLimitModalProps> = ({
  open,
  onClose,
  retryAfterSeconds
}) => {
  const [secondsLeft, setSecondsLeft] = useState(retryAfterSeconds);

  useEffect(() => {
    if (!open) return;
    setSecondsLeft(retryAfterSeconds);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, retryAfterSeconds, onClose]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay =
    minutes > 0
      ? `${minutes}m ${seconds.toString().padStart(2, '0')}s`
      : `${seconds}s`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Slow Down
          </DialogTitle>
          <DialogDescription>
            You're picking winners too fast. Please wait before trying again.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-6 space-y-2">
          <span className="text-5xl font-bold tabular-nums">{timeDisplay}</span>
          <p className="text-sm text-muted-foreground">
            until you can pick again
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
