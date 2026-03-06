'use client';

import { useState } from 'react';
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
import Link from 'next/link';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { CheckCircle2, PlusCircle } from 'lucide-react';
import {
  DEFAULT_USER_FEATURE_FLAGS,
  USER_FEATURE_FLAG_DESCRIPTIONS,
  USER_FEATURE_FLAG_LABELS,
  HOST_DASHBOARD_FEATURE_FLAG_KEY,
  BASIC_DASHBOARD_FEATURE_FLAG_KEY
} from '@/schemas/feature-flags';
import { widetype } from '@/lib/widetype';
import { useSession } from 'next-auth/react';
import { UserAccountType } from '@prisma/client';
import { useProcedure } from '@/lib/mrpc/hook';
import updateAccountType from '@/procedures/user/update-account-type';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export const FeatureSettings = () => {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [showContact, setShowContact] = useState(false);
  const [showCannotDisableDialog, setShowCannotDisableDialog] = useState(false);
  const [showEnableHostDialog, setShowEnableHostDialog] = useState(false);

  const isHost = session?.user?.accountType === UserAccountType.HOST;

  const updateAccountTypeProcedure = useProcedure({
    action: updateAccountType,
    onSuccess: async (data) => {
      const isNowHost = data.accountType === UserAccountType.HOST;
      toast.success(
        isNowHost
          ? 'Host access enabled successfully!'
          : 'Host access disabled successfully!'
      );
      await update({
        accountType: data.accountType
      });
      router.refresh();
    },
    onFailure(error) {
      toast.error(error.message);
    }
  });

  const handleEnableHostClick = () => {
    setShowEnableHostDialog(true);
  };

  const handleEnableHost = () => {
    updateAccountTypeProcedure.run({ accountType: UserAccountType.HOST });
    setShowEnableHostDialog(false);
  };

  const handleDisableHost = () => {
    updateAccountTypeProcedure.run({
      accountType: UserAccountType.PARTICIPANT
    });
  };

  const handleDisableAction = () => {
    setShowCannotDisableDialog(true);
  };

  const handleRequestAction = () => {
    setShowContact(true);
  };

  return (
    <>
      <div className="space-y-4">
        {widetype.keys(USER_FEATURE_FLAG_LABELS).map((key) => {
          const isHostFeature = key === HOST_DASHBOARD_FEATURE_FLAG_KEY;
          const isParticipateFeature = key === BASIC_DASHBOARD_FEATURE_FLAG_KEY;
          const enabled = isHostFeature
            ? isHost
            : DEFAULT_USER_FEATURE_FLAGS[key];

          return (
            <FeatureFlagCard
              key={key}
              label={USER_FEATURE_FLAG_LABELS[key]}
              description={USER_FEATURE_FLAG_DESCRIPTIONS[key]}
              enabled={enabled}
              onDisable={
                isHostFeature ? handleDisableHost : handleDisableAction
              }
              onRequest={
                isHostFeature ? handleEnableHostClick : handleRequestAction
              }
              isLoading={isHostFeature && updateAccountTypeProcedure.isLoading}
              disableToggle={isParticipateFeature}
            />
          );
        })}
      </div>

      <ContactSupportDialog open={showContact} onOpenChange={setShowContact} />
      <CannotDisableDialog
        open={showCannotDisableDialog}
        onOpenChange={setShowCannotDisableDialog}
      />
      <EnableHostDialog
        open={showEnableHostDialog}
        onOpenChange={setShowEnableHostDialog}
        onConfirm={handleEnableHost}
        isLoading={updateAccountTypeProcedure.isLoading}
      />
    </>
  );
};

const FeatureFlagCard: React.FC<{
  label: string;
  description: string;
  enabled: boolean;
  onRequest: () => void;
  onDisable: () => void;
  isLoading?: boolean;
  disableToggle?: boolean;
}> = ({
  label,
  description,
  enabled,
  onRequest,
  onDisable,
  isLoading,
  disableToggle
}) => {
  return (
    <Card>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 space-y-1">
            <Label className="text-base font-semibold">{label}</Label>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex items-center sm:items-start">
            {enabled ? (
              <Button
                size="sm"
                onClick={disableToggle ? undefined : onDisable}
                disabled={isLoading || disableToggle}
                variant="outline"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {isLoading ? 'Updating...' : 'Enabled'}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={disableToggle ? undefined : onRequest}
                disabled={isLoading || disableToggle}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                {isLoading ? 'Enabling...' : 'Enable Access'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ContactSupportDialog: React.FC<{
  open: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ open, onOpenChange }) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Contact Support</AlertDialogTitle>
          <AlertDialogDescription>
            In order to enable this feature, please contact our support team.
            We&apos;d be happy to discuss your needs and see how we can assist
            you.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Okay
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Link href="/contact" className="inline-flex">
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
          <AlertDialogTitle>Contact Support</AlertDialogTitle>
          <AlertDialogDescription>
            In order to disable this feature, please contact our support team.
            We&apos;d be happy to discuss your needs and see how we can assist
            you.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>
            Okay
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Link href="/contact" className="inline-flex">
              Contact Support
            </Link>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const EnableHostDialog: React.FC<{
  open: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
  onConfirm: () => void;
  isLoading: boolean;
}> = ({ open, onOpenChange, onConfirm, isLoading }) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Enable Host Access</AlertDialogTitle>
          <AlertDialogDescription>
            Switching to a Host account will allow you to create and manage
            giveaways for your community, brand, or organization.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">What you&apos;ll get:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
              <li>Create unlimited giveaways</li>
              <li>Manage teams and collaborators</li>
              <li>Access advanced analytics</li>
              <li>Customize giveaway designs</li>
              <li>Integration with social platforms</li>
            </ul>
          </div>

          <div className="text-sm text-muted-foreground">
            You can always participate in giveaways as a Host account. This
            change can be reversed at any time.
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Enabling...' : 'Enable Host Access'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
