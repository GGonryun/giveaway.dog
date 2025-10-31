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
import {
  AlertDialogHeader,
  AlertDialogFooter
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle2, PlusCircle } from 'lucide-react';
import {
  DEFAULT_TEAM_FEATURE_FLAGS,
  TEAM_FEATURE_FLAG_DESCRIPTIONS,
  TEAM_FEATURE_FLAG_LABELS,
  TeamFeatureFlagKeySchema
} from '@/schemas/feature-flags';
import { widetype } from '@/lib/widetype';
import { featureFlags } from '@/lib/feature-flags';

interface TeamFeaturesProps {
  teamFeatureFlags: TeamFeatureFlagKeySchema[];
}

export const TeamFeatures: React.FC<TeamFeaturesProps> = ({
  teamFeatureFlags
}) => {
  const [showContact, setShowContact] = useState(false);
  const [showCannotDisableDialog, setShowCannotDisableDialog] = useState(false);

  const handleDisableAction = () => {
    setShowCannotDisableDialog(true);
  };

  const handleRequestAction = () => {
    setShowContact(true);
  };

  return (
    <>
      <div className="space-y-4">
        {widetype.keys(TEAM_FEATURE_FLAG_LABELS).map((key) => (
          <FeatureFlagCard
            key={key}
            label={TEAM_FEATURE_FLAG_LABELS[key]}
            description={TEAM_FEATURE_FLAG_DESCRIPTIONS[key]}
            enabled={
              DEFAULT_TEAM_FEATURE_FLAGS[key] ||
              featureFlags.parseTeam(teamFeatureFlags, key)
            }
            onDisable={handleDisableAction}
            onRequest={handleRequestAction}
          />
        ))}
      </div>

      <ContactSupportDialog open={showContact} onOpenChange={setShowContact} />
      <CannotDisableDialog
        open={showCannotDisableDialog}
        onOpenChange={setShowCannotDisableDialog}
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
}> = ({ label, description, enabled, onRequest, onDisable }) => {
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
              <Button size="sm" onClick={onDisable}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Enabled
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={onRequest}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Request Access
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
            In order to enable this feature for your team, please contact our
            support team. We&apos;d be happy to discuss your needs and see how
            we can assist you.
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
          <AlertDialogTitle>Contact Support</AlertDialogTitle>
          <AlertDialogDescription>
            In order to disable this feature for your team, please contact our
            support team. We&apos;d be happy to discuss your needs and see how
            we can assist you.
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
