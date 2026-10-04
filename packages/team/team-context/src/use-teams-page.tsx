import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const key = 'step';
const base = '/app';

export const useTeamsPage = () => {
  const [isPending, setIsPending] = useState(true);
  const [step, setStep] = useState(1);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const step = searchParams.get(key);
    if (step != null) {
      setStep(Number(step));
    }
    setIsPending(false);
  }, [router, searchParams]);

  const navigate = (newStep: number) => {
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
