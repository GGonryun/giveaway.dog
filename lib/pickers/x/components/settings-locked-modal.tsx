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
import { Lock, CheckCircle2, Zap } from 'lucide-react';
import Link from 'next/link';
import { SCRAPEBADGER_CREDIT_LIMIT } from '@/lib/scrapebadger/settings';

interface SettingsLockedModalProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsLockedModal: React.FC<SettingsLockedModalProps> = ({
  open,
  onClose
}) => {
  const benefits = [
    `${SCRAPEBADGER_CREDIT_LIMIT.toLocaleString()} credits per day (your own personal pool)`,
    'Customize draw settings and filters',
    '90 day retention of past picks and data',
    'Automatically filter out bots and spam accounts',
    'Access to advanced filters and settings'
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            Settings Locked
          </DialogTitle>
          <DialogDescription>
            Create a free account to customize your draw settings and filters.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Create a free account to get:
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/login">Create Free Account</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
