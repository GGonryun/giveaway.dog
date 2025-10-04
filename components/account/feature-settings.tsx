import { useState } from 'react';
import { SectionHeader } from './section-header';
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
import { Button } from '../ui/button';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';

export const FeatureSettings = () => {
  const user = useUser();

  const [showHostAccessDialog, setShowHostAccessDialog] = useState(false);

  const handleRequestHostAccess = () => {
    setShowHostAccessDialog(true);
  };
  return (
    <>
      <Card>
        <SectionHeader
          title="Account Type"
          description="Manage your account type and access level."
        />
        <CardContent className="flex flex-col w-full max-w-2xl gap-2 space-y-2">
          {user.type?.includes(UserType.PARTICIPATE) && (
            <div className="flex items-center justify-between p-3  bg-muted rounded-lg">
              <span className="text-sm">Participant</span>
              <Button size="badge">Active</Button>
            </div>
          )}
          {user.type?.includes(UserType.HOST) ? (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">Host</span>
              <Button size="badge" variant="outline">
                Active
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 border-1 border-dashed rounded-lg">
              <span className="text-sm text-muted-foreground">Host Access</span>
              <Button
                size="badge"
                variant="outline"
                onClick={handleRequestHostAccess}
              >
                <PlusIcon />
                Request Access
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <HostAccessDialog
        open={showHostAccessDialog}
        onOpenChange={setShowHostAccessDialog}
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
          <AlertDialogTitle>🚀 Host Access - Beta Feature</AlertDialogTitle>
          <AlertDialogDescription>
            Host access is currently in <strong>beta</strong> and not yet
            available for public requests.
          </AlertDialogDescription>

          <AlertDialogDescription>
            If you want early access, please contact us via our support page.
            We're working hard to bring you the ability to create and host your
            own giveaways.
          </AlertDialogDescription>

          <AlertDialogDescription>
            Thank you for your patience as we perfect this feature!
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
