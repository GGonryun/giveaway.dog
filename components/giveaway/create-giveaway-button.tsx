'use client';

import { Button } from '../ui/button';
import { PlusIcon } from 'lucide-react';
import { createSweepstakes } from '@/actions/app/create-sweepstakes';
import { Spinner } from '../ui/spinner';
import { useRouter } from 'next/navigation';
import z from 'zod';
import { toast } from 'sonner';
import { useServerAction } from '../hooks/use-server-action';

const schema = z.object({ id: z.string() });

export const CreateGiveawayButton = () => {
  const router = useRouter();

  const [isPending, onClick] = useServerAction({
    schema,
    action: createSweepstakes,
    onSuccess: (data) => {
      router.push(`/app/create/${data.id}`);
    },
    onError: () => {
      toast.error(`Application Error`, {
        description: 'Failed to create giveaway'
      });
    }
  });

  return (
    <Button
      variant="secondary"
      size="sm"
      className="flex -mt-0.5"
      disabled={isPending}
      onClick={onClick}
    >
      {isPending ? <Spinner /> : <PlusIcon />}
      {isPending ? 'Creating...' : 'Create'}
    </Button>
  );
};
