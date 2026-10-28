'use client';

import { UserAccountType } from '@giveaway/db-model';
import { useRouter, useSearchParams } from 'next/navigation';

export type OnboardingStep = 1 | 2;

const toAccountType = (value: string | null): UserAccountType =>
  value === UserAccountType.HOST
    ? UserAccountType.HOST
    : UserAccountType.PARTICIPANT;

export const useOnboardingPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step: OnboardingStep = searchParams.get('step') === '2' ? 2 : 1;
  const redirectTo = searchParams.get('redirectTo') ?? undefined;
  const accountType = toAccountType(searchParams.get('accountType'));

  const navigateToStep = (
    newStep: OnboardingStep,
    newAccountType: UserAccountType
  ) => {
    const params = new URLSearchParams({ step: `${newStep}` });
    if (newAccountType === UserAccountType.HOST) {
      params.set('accountType', newAccountType);
    }
    if (redirectTo) params.set('redirectTo', redirectTo);
    router.push(`/onboarding?${params.toString()}`);
  };

  const navigateToAccountTypeStep = () => navigateToStep(1, accountType);
  const navigateToProfileStep = (newAccountType: UserAccountType) =>
    navigateToStep(2, newAccountType);

  return {
    step,
    accountType,
    redirectTo,
    navigateToAccountTypeStep,
    navigateToProfileStep
  };
};
