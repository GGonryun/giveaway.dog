'use client';

import { GiveawayParticipation } from '@/components/sweepstakes/giveaway-participation';
import {
  GiveawayState,
  ParticipantSweepstakeSchema,
  UserParticipationSchema
} from '@/schemas/giveaway/schemas';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import Link from 'next/link';
import { ArrowLeftIcon, ShareIcon, CircleAlertIcon } from 'lucide-react';
import { UserProfileSchema } from '@/schemas/user';
import { useProcedure } from '@/lib/mrpc/hook';
import submitTask from '@/procedures/tasks/submit-task';
import { toast } from 'sonner';

type SweepstakesParticipationPageContentProps = ParticipantSweepstakeSchema & {
  userProfile?: UserProfileSchema;
  userParticipation?: UserParticipationSchema;
  state: GiveawayState;
};

export const SweepstakesParticipationPage: React.FC<
  SweepstakesParticipationPageContentProps
> = (props) => {
  const { userProfile, userParticipation, ...sweepstake } = props;
  const router = useRouter();
  const pathname = usePathname();

  const submitTaskProcedure = useProcedure({
    action: submitTask,
    onSuccess() {
      toast.success('Task completed!');
    },
    onFailure() {
      toast.error(
        'Failed to complete task. Please try again, if the issue persists contact support.'
      );
    }
  });

  const handleLogin = () => {
    const search = new URLSearchParams([['callbackUrl', pathname]]);
    router.push(`/login?${search.toString()}`);
  };

  const handleCompleteProfile = () => {
    router.push('/profile/complete');
  };

  const handleTaskComplete = (taskId: string) => {
    submitTaskProcedure.run({ taskId });
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 p-2 pb-4 sm:p-4 sm:pb-6 sm:container sm:max-w-2xl">
      <div className="flex flex-col sm:flex-row gap-2 w-full justify-between">
        <Button asChild className="w-full sm:w-fit self-start">
          <Link href="/browse">
            <ArrowLeftIcon />
            Browse More Giveaways
          </Link>
        </Button>
        <div className="flex flex-row gap-2">
          <Button variant="outline" className="grow sm:grow-0">
            <ShareIcon />
            Share
          </Button>
          <Button variant="destructive">
            <CircleAlertIcon />
            Report
          </Button>
        </div>
      </div>
      <GiveawayParticipation
        {...props}
        isLoading={submitTaskProcedure.isLoading}
        onTaskComplete={handleTaskComplete}
        onLogin={handleLogin}
        onCompleteProfile={handleCompleteProfile}
      />
    </div>
  );
};
