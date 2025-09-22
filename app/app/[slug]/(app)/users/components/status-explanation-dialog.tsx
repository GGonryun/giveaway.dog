'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { CheckCircle, UserX } from 'lucide-react';

interface StatusExplanationDialogProps {
  open: boolean;
  onClose: () => void;
  status: 'active' | 'blocked';
}

export const StatusExplanationDialog = ({
  open,
  onClose,
  status
}: StatusExplanationDialogProps) => {
  const isActive = status === 'active';

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            {isActive ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Active User Status</span>
              </>
            ) : (
              <>
                <UserX className="h-5 w-5 text-red-600" />
                <span>Blocked User Status</span>
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            {isActive ? (
              <>
                <p>
                  <strong>Active users</strong> are allowed to participate in any giveaway and are eligible to win prizes.
                </p>
                <p>
                  They have full access to all giveaway features and can be automatically selected as winners during prize drawings.
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong>Blocked users</strong> are "shadow banned" - they can continue to participate in giveaways but will never be eligible for winning prizes unless explicitly selected by an administrator.
                </p>
                <p>
                  This approach prevents users from discovering they've been blocked and creating new accounts to circumvent the restriction. From their perspective, they can still enter giveaways normally.
                </p>
                <p className="text-amber-600 font-medium">
                  Blocked users can only win if manually selected by giveaway administrators.
                </p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>
            Got it
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};