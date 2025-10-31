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
import { Trophy, RotateCcw, UserPlus, Save } from 'lucide-react';
import Link from 'next/link';

interface NamePickerWinnerModalProps {
  winner: string;
  isAuthenticated: boolean;
  onClose: () => void;
  onSpinAgain: () => void;
}

export function NamePickerWinnerModal({
  winner,
  isAuthenticated,
  onClose,
  onSpinAgain
}: NamePickerWinnerModalProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Trophy className="h-16 w-16 text-yellow-500" />
              <div className="absolute inset-0 animate-ping">
                <Trophy className="h-16 w-16 text-yellow-500 opacity-20" />
              </div>
            </div>
          </div>
          <DialogTitle className="text-center text-3xl">
            We Have a Winner!
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            Congratulations! 🎉
          </DialogDescription>
        </DialogHeader>

        <div className="my-6">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-lg p-8 text-center">
            <p className="text-3xl font-bold text-primary break-words">
              {winner}
            </p>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="bg-muted/50 rounded-lg p-4 mb-4 border border-border">
            <div className="flex items-start gap-3 mb-3">
              <Save className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm mb-1">
                  Want to save your wheels?
                </h4>
                <p className="text-xs text-muted-foreground">
                  Create a free account to save, share, and rerun your name
                  picker wheels anytime!
                </p>
              </div>
            </div>
            <Button asChild className="w-full" size="sm">
              <Link href="/signup?callbackUrl=/tools/pickers/names">
                <UserPlus className="mr-2 h-4 w-4" />
                Create Free Account
              </Link>
            </Button>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onSpinAgain}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Spin Again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
