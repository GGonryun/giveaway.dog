import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const key = 'step';
const base = '/app';

type TeamsPageStep = 1 | 2;

const toStep = (value: string | null): TeamsPageStep => (value === '2' ? 2 : 1);

export const useTeamsPage = () => {
  const [isPending, setIsPending] = useState(true);
  const [step, setStep] = useState<TeamsPageStep>(1);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setStep(toStep(searchParams.get(key)));
    setIsPending(false);
  }, [router, searchParams]);

  const navigate = (newStep: TeamsPageStep) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, newStep.toString());
    router.push(`${base}?${params.toString()}`);
  };

  return {
    isPending,
    step,
    navigateToSelect: () => navigate(1),
    navigateToCreate: () => navigate(2)
  };
};
