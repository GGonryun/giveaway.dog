'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertCircle, Calendar } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useProcedure } from '@/lib/mrpc/hook';
import { toast } from 'sonner';
import verifyAge from '@/procedures/sweepstakes/verify-age';

interface AgeVerificationProps {
  sweepstakesId: string;
  minimumAge: number;
  label?: string;
  required?: boolean;
  onVerified: () => void;
  isVerified?: boolean;
  userId: string;
}

export const AgeVerification = ({
  sweepstakesId,
  minimumAge,
  label,
  required = true,
  onVerified,
  isVerified = false,
  userId
}: AgeVerificationProps) => {
  const [isChecked, setIsChecked] = useState(false);

  const verifyAgeProcedure = useProcedure({
    action: verifyAge,
    onSuccess: () => {
      toast.success('Age verified successfully');
      onVerified();
    },
    onFailure: (error) => {
      toast.error(error.message || 'Failed to verify age');
    }
  });

  const defaultLabel = `I am ${minimumAge} years of age or older`;
  const displayLabel = label || defaultLabel;

  const handleVerification = async () => {
    if (!isChecked) {
      toast.error('Please confirm your age to continue');
      return;
    }

    verifyAgeProcedure.run({
      userId,
      sweepstakesId
    });
  };

  if (isVerified) {
    return (
      <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
        <div className="flex items-center gap-3 text-green-800">
          <Calendar className="h-5 w-5" />
          <span className="font-medium">Age verification completed</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 my-2">
      <Alert variant="error" className="[&>svg]:size-6 has-[>svg]:gap-x-5">
        <AlertCircle />
        <AlertTitle className="text-lg font-semibold text-orange-800">
          Age Verification Required
        </AlertTitle>
        <AlertDescription>
          This giveaway requires participants to be at least {minimumAge} years
          old. This verification is specific to this giveaway only.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="age-verification"
            checked={isChecked}
            onCheckedChange={(checked) => setIsChecked(checked as boolean)}
            required={required}
          />
          <Label
            htmlFor="age-verification"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {displayLabel}
          </Label>
        </div>

        <Button
          onClick={handleVerification}
          disabled={!isChecked || verifyAgeProcedure.isLoading}
          className="w-full"
        >
          {verifyAgeProcedure.isLoading
            ? 'Verifying...'
            : 'Verify Age & Continue'}
        </Button>
      </div>
    </div>
  );
};
