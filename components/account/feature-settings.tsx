import { useState } from 'react';
import { UserType } from '@prisma/client';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog';
import { AlertDialogHeader, AlertDialogFooter } from '../ui/alert-dialog';
import { Card, CardContent } from '../ui/card';
import { useUser } from '../context/user-provider';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { CheckCircle2, PlusCircle } from 'lucide-react';

export const FeatureSettings = () => {
  const user = useUser();

  const [showHostAccessDialog, setShowHostAccessDialog] = useState(false);
  const [showCannotDisableDialog, setShowCannotDisableDialog] = useState(false);

  const hasParticipateAccess = user.type?.includes(UserType.PARTICIPATE);
  const hasHostAccess = user.type?.includes(UserType.HOST);

  const handleRequestHostAccess = () => {
    setShowHostAccessDialog(true);
  };

  const handleParticipateClick = () => {
    setShowCannotDisableDialog(true);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Participate Sweepstakes Card */}
        <Card>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 space-y-1">
                <Label className="text-base font-semibold">
                  Participate in Sweepstakes
                </Label>
                <p className="text-sm text-muted-foreground">
                  Join and enter sweepstakes hosted by others. Complete tasks to
                  earn entries and increase your chances of winning prizes.
                </p>
              </div>
              <div className="flex items-center sm:items-start">
                <Button size="sm" onClick={handleParticipateClick}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Enabled
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Host Sweepstakes Card */}
        <Card>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 space-y-1">
                <Label className="text-base font-semibold">
                  Host Sweepstakes
                </Label>
                <p className="text-sm text-muted-foreground">
                  Create and manage your own sweepstakes. Set up tasks, manage
                  participants, and select winners for your giveaways.
                </p>
              </div>
              <div className="flex items-center sm:items-start">
                {hasHostAccess ? (
                  <Button size="sm">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Enabled
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRequestHostAccess}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Request Access
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <HostAccessDialog
        open={showHostAccessDialog}
        onOpenChange={setShowHostAccessDialog}
      />
      <CannotDisableDialog
        open={showCannotDisableDialog}
        onOpenChange={setShowCannotDisableDialog}
      />
    </>
  );
};

const HostAccessDialog: React.FC<{
  open: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ open, onOpenChange }) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Host Access - Beta Feature</AlertDialogTitle>
          <AlertDialogDescription>
            Host access is currently in <strong>beta</strong> and not yet
            available for public requests. If you want early access, please
            contact us via our support page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Okay
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Link href="/support" className="inline-flex">
              Contact Support
            </Link>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const CannotDisableDialog: React.FC<{
  open: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ open, onOpenChange }) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Feature Cannot Be Disabled</AlertDialogTitle>
          <AlertDialogDescription>
            This feature cannot be disabled. All users can participate in
            sweepstakes by default.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Okay
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
