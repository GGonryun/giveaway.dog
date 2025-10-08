import { Separator } from '@/components/ui/separator';
import { TaskActionProps, TaskContent, TaskControls } from '../building-blocks';
import { TwitterConnectTaskSchema } from '@/schemas/tasks/schemas';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTaskTheme } from '@/components/tasks/theme';
import { UnplugIcon } from 'lucide-react';
import { useGiveawayParticipation } from '@/components/sweepstakes/giveaway-participation-context';
import { useProcedure } from '@/lib/mrpc/hook';
import login from '@/procedures/auth/login';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

export const TwitterConnectTaskActionForm: React.FC<
  TaskActionProps<TwitterConnectTaskSchema>
> = ({ onCancel, onSubmit, task }) => {
  const { userProfile } = useGiveawayParticipation();
  const pathname = usePathname();
  const theme = useTaskTheme();
  const provider = useMemo(() => {
    return userProfile?.providers.find((p) => p.type === 'twitter');
  }, [userProfile?.providers]);

  const loginProcedure = useProcedure({
    action: login,
    onSuccess: () => {
      toast.success('Twitter connected');
    }
  });

  const handleConnect = () => {
    const params = new URLSearchParams();
    // add task id to params to complete the task after login
    params.append('taskId', task.id);
    const redirectTo = `${pathname}?${params.toString()}`;

    // Redirect to login with twitter
    return loginProcedure.run({
      provider: 'twitter',
      revalidate: 'true',
      redirectTo
    });
  };

  const handleSubmit = () => {
    onSubmit();
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <>
      <TaskContent className="flex flex-col items-center text-center gap-2">
        {provider ? (
          <p className="text-sm text-foreground mt-2">
            You are connected as{' '}
            <Link href={'/account'} className="underline">
              {provider.label.toLocaleLowerCase()}
            </Link>
            .
          </p>
        ) : (
          <>
            <Button
              className={cn(theme.action)}
              onClick={handleConnect}
              disabled={!!provider || loginProcedure.isLoading}
            >
              <UnplugIcon />
              Connect
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Connect your (X) Twitter account to complete this task.
            </p>
          </>
        )}
      </TaskContent>
      <Separator />
      <TaskControls
        disabled={!provider || loginProcedure.isLoading}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </>
  );
};
