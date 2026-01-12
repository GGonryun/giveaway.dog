import { useProcedure } from '@/lib/mrpc/hook';
import { disqualifyParticipant } from './disqualify-participant';
import { useRouter } from 'next/navigation';

export const useDisqualifyParticipant = ({
  sweepstakesId
}: {
  sweepstakesId: string;
}) => {
  const router = useRouter();

  return useProcedure({
    action: disqualifyParticipant,
    onSuccess: () => {
      router.refresh();
    }
  });
};
