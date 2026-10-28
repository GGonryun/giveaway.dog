'use client';

import { cn } from '@giveaway/ui-utils/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@giveaway/ui-primitives/card';
import { AuthFooter } from '@giveaway/auth-login-ui/auth-footer';
import { AccountTypeStep } from './account-type-step';
import { ProfileStep } from './profile-step';
import { useOnboardingPage } from './use-onboarding-page';

export function OnboardingForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const {
    step,
    accountType,
    redirectTo,
    navigateToAccountTypeStep,
    navigateToProfileStep
  } = useOnboardingPage();

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center mb-2">
          <CardTitle className="text-xl">
            {step === 1 ? 'Welcome to Giveaway.dog' : 'Complete Your Profile'}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? 'How would you like to use Giveaway.dog?'
              : 'What should we call you?'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-6">
            {step === 1 && (
              <AccountTypeStep
                initialAccountType={accountType}
                onNext={navigateToProfileStep}
              />
            )}
            {step === 2 && (
              <ProfileStep
                accountType={accountType}
                redirectTo={redirectTo}
                onBack={navigateToAccountTypeStep}
              />
            )}
          </div>
        </CardContent>
      </Card>
      <AuthFooter />
    </div>
  );
}
