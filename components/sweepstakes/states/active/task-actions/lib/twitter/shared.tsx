import { Separator } from '@/components/ui/separator';
import {
  TaskActionProps,
  TaskContent,
  TaskControls
} from '../../building-blocks';
import {
  TwitterConnectTaskSchema,
  TwitterFollowTaskSchema,
  TwitterRetweetTaskSchema
} from '@/schemas/tasks/schemas';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TaskTheme, useTaskTheme } from '@/components/tasks/theme';
import { UnplugIcon } from 'lucide-react';
import { useGiveawayParticipation } from '@/components/sweepstakes/giveaway-participation-context';
import { useProcedure } from '@/lib/mrpc/hook';
import login from '@/procedures/auth/login';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { ProviderSchema } from '@/schemas/user';

const useTwitterConnection = (taskId: string) => {
  const pathname = usePathname();

  const loginProcedure = useProcedure({
    action: login,
    onSuccess: () => {
      toast.success('Twitter connected');
    }
  });

  const { userProfile } = useGiveawayParticipation();
  const provider = useMemo(() => {
    return userProfile?.providers.find((p) => p.type === 'twitter');
  }, [userProfile?.providers]);

  const connect = () => {
    const params = new URLSearchParams();
    // add task id to params to complete the task after login
    params.append('taskId', taskId);
    const redirectTo = `${pathname}?${params.toString()}`;

    // Redirect to login with twitter
    return loginProcedure.run({
      provider: 'twitter',
      revalidate: 'true',
      redirectTo
    });
  };

  return { connect, provider };
};

export const WithTwitterConnection: React.FC<
  TaskActionProps<
    | TwitterConnectTaskSchema
    | TwitterFollowTaskSchema
    | TwitterRetweetTaskSchema
  > & {
    render: (ctx: {
      theme: TaskTheme;
      provider: ProviderSchema;
    }) => React.ReactNode;
    disabled?: boolean;
  }
> = ({ render, onSubmit, onCancel, task, disabled }) => {
  const { connect, provider } = useTwitterConnection(task.id);

  const theme = useTaskTheme();

  const loginProcedure = useProcedure({
    action: login,
    onSuccess: () => {
      toast.success('Twitter connected');
    }
  });

  return (
    <>
      <TaskContent className="flex flex-col items-center text-center gap-2">
        {provider ? (
          render({ provider, theme })
        ) : (
          <>
            <Button
              className={cn(theme.action)}
              onClick={connect}
              disabled={!!provider || loginProcedure.isLoading}
            >
              <UnplugIcon />
              Connect
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Connect an account to complete this task.
            </p>
          </>
        )}
      </TaskContent>
      <Separator />
      <TaskControls
        disabled={disabled || !provider || loginProcedure.isLoading}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </>
  );
};
