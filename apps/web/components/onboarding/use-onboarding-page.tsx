'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export type OnboardingStep = 1 | 2;

export const useOnboardingPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get('step');
  const [step, setStep] = useState<OnboardingStep>(stepParam === '2' ? 2 : 1);

  const navigateToStep = (newStep: OnboardingStep) => {
    setStep(newStep);
    router.push(`/onboarding?step=${newStep}`);
  };

  const navigateToAccountTypeStep = () => navigateToStep(1);
  const navigateToProfileStep = () => navigateToStep(2);

  return {
    step,
    navigateToAccountTypeStep,
    navigateToProfileStep
  };
};
