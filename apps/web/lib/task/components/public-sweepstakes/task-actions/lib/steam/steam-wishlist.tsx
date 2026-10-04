import { TaskActionProps } from '../../building-blocks';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@giveaway/ui-primitives/button';
import { UserPlus } from 'lucide-react';
import { cn } from '@giveaway/ui-utils/utils';
import { WithProviderConnection } from '../provider-connection';

import {
  Alert,
  AlertTitle,
  AlertDescription
} from '@giveaway/ui-primitives/alert';
import { AlertCircleIcon } from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@giveaway/ui-primitives/dialog';
import { ErrorDisplay } from '../error-display';
import { PRIVATE_STEAM_WISHLIST_ERROR } from '@giveaway/task-model/steam-errors';
import { SteamWishlistTaskSchema } from '@giveaway/task-model/schemas';

export const SteamWishlistTaskActionForm: React.FC<
  TaskActionProps<SteamWishlistTaskSchema>
> = ({ onCancel, onSubmit, submission, error, task, isLoading }) => {
  const [performedAction, setPerformedAction] = useState(false);
  const [showPrivateDialog, setShowPrivateDialog] = useState(false);

  useEffect(() => {
    if (error) {
      setPerformedAction(false);
      if (
        error.code === 'VALIDATION_ERROR' &&
        error.cause === PRIVATE_STEAM_WISHLIST_ERROR
      ) {
        setShowPrivateDialog(true);
      }
    }
  }, [error]);

  return (
    <WithProviderConnection
      task={task}
      submission={submission}
      disabled={!performedAction}
      onCancel={onCancel}
      onSubmit={onSubmit}
      isLoading={isLoading}
      render={({ theme }) => (
        <div className="space-y-4">
          {isLoading && performedAction ? (
            <p className="text-sm text-muted-foreground mt-2">
              Verifying task action...
            </p>
          ) : performedAction && !error ? (
            <p className="text-sm text-foreground mt-2">
              Thank you for wishlisting!
            </p>
          ) : (
            <div className="mt-2">
              <div className="space-y-4">
                <Button asChild className={cn(theme.action)}>
                  <Link
                    href={task.appId}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setPerformedAction(true)}
                  >
                    <UserPlus />
                    Add to Wishlist
                  </Link>
                </Button>
                {error?.code === 'VALIDATION_ERROR' && (
                  <ErrorDisplay message={error.message} />
                )}
              </div>
              {!submission && (
                <Button
                  variant="link"
                  onClick={() => setPerformedAction(true)}
                  className="text-xs mt-2 text-foreground"
                >
                  I already added to wishlist or own the game
                </Button>
              )}
            </div>
          )}

          <PrivateSteamProfileDialog
            open={showPrivateDialog}
            onOpenChange={setShowPrivateDialog}
          />
        </div>
      )}
    />
  );
};

export const PrivateSteamProfileDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ open, onOpenChange }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Private Steam Profile</DialogTitle>
        <DialogDescription>
          Please make sure your Steam Profile Privacy Settings are configured
          correctly to verify your wishlist.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <p className="text-sm">
          Your Steam profile privacy settings must be set as follows:
        </p>

        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>
            <strong>My profile</strong>: Public
          </li>
          <li>
            <strong>Game details</strong>: Public
          </li>
          <li>
            <strong>Always keep my total playtime private...</strong>:{' '}
            <em>Off</em>
          </li>
        </ul>

        <Button asChild className="w-full">
          <Link
            href="https://steamcommunity.com/my/edit/settings"
            target="_blank"
            rel="noopener noreferrer"
          >
            Edit Settings
          </Link>
        </Button>

        <Alert variant="info">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription className="text-sm inline">
            It can take up to <strong>one hour</strong> for privacy changes to
            take effect on Steam&apos;s servers.
          </AlertDescription>
        </Alert>

        <div className="relative w-full aspect-[1877/848] border rounded-lg overflow-hidden">
          <Image
            src="/images/steam-privacy-settings.png"
            alt="Steam Privacy Settings"
            fill={true}
            className="object-contain"
          />
        </div>
      </div>
    </DialogContent>
  </Dialog>
);
