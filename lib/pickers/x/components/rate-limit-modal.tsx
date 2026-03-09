'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Clock, Zap, CheckCircle2, LogIn, Gem } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { SCRAPEBADGER_CREDIT_LIMIT } from '@/lib/scrapebadger/settings';

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
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  const freeBenefits = [
    `${SCRAPEBADGER_CREDIT_LIMIT.toLocaleString()} credits per day (your own personal pool)`,
    '90 day retention of past picks and data',
    'Automatically filter out bots and spam accounts',
    'Access to advanced filters and settings'
  ];

  const proBenefits = [
    '365 day retention of past picks and data',
    'Pick winners from multiple posts at once',
    'Schedule giveaways for later',
    'Priority support and early access to features',
    'Disqualification reasons for each user'
  ];

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

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const timeDisplay =
    hours > 0
      ? `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
      : minutes > 0
        ? `${minutes}m ${seconds.toString().padStart(2, '0')}s`
        : `${seconds}s`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Rate Limit Reached
          </DialogTitle>
          <DialogDescription>
            {isAuthenticated
              ? "You've reached your rate limit. Upgrade to PRO for higher limits."
              : "You've reached the anonymous user rate limit."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6 space-y-2">
          <span className="text-5xl font-bold tabular-nums">{timeDisplay}</span>
          <p className="text-sm text-muted-foreground">
            until you can try again
          </p>
        </div>

        {!isAuthenticated ? (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Create a free account to get:
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {freeBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Go Back
              </Button>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Create Account
                </Link>
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Upgrade to PRO for unlimited credits:
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {proBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Go Back
              </Button>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/pricing">
                  <Gem />
                  Upgrade to PRO
                </Link>
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
