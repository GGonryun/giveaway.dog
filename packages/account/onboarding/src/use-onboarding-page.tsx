'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export type OnboardingStep = 1 | 2;

export const useOnboardingPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get('step');
  const redirectTo = searchParams.get('redirectTo') ?? undefined;
  const [step, setStep] = useState<OnboardingStep>(stepParam === '2' ? 2 : 1);

  const navigateToStep = (newStep: OnboardingStep) => {
    setStep(newStep);
    const params = new URLSearchParams({ step: `${newStep}` });
    if (redirectTo) params.set('redirectTo', redirectTo);
    router.push(`/onboarding?${params.toString()}`);
  };

  const navigateToAccountTypeStep = () => navigateToStep(1);
  const navigateToProfileStep = () => navigateToStep(2);

  return {
    step,
    redirectTo,
    navigateToAccountTypeStep,
    navigateToProfileStep
  };
};
