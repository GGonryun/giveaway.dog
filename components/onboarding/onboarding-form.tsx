'use client';

import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { AuthFooter } from '@/components/auth/auth-footer';
import { AccountTypeStep } from './account-type-step';
import { ProfileStep } from './profile-step';
import { useOnboardingPage } from './use-onboarding-page';
import { UserAccountType } from '@prisma/client';
import { useState } from 'react';

export function OnboardingForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { step, navigateToAccountTypeStep, navigateToProfileStep } =
    useOnboardingPage();
  const [selectedAccountType, setSelectedAccountType] =
    useState<UserAccountType>(UserAccountType.PARTICIPANT);

  const handleAccountTypeSelected = (accountType: UserAccountType) => {
    setSelectedAccountType(accountType);
    navigateToProfileStep();
  };

  const handleBack = () => {
    navigateToAccountTypeStep();
  };

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center mb-2">
          <CardTitle className="text-xl">
            {step === 1 ? 'Choose Your Path' : 'Complete Your Profile'}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? 'Select how you want to use Giveaway.dog'
              : 'Set up your username and profile picture'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-6">
            {step === 1 && (
              <AccountTypeStep onNext={handleAccountTypeSelected} />
            )}
            {step === 2 && (
              <ProfileStep
                accountType={selectedAccountType}
                onBack={handleBack}
              />
            )}
          </div>
        </CardContent>
      </Card>
      <AuthFooter />
    </div>
  );
}
