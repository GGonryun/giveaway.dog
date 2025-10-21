import { Separator } from '@/components/ui/separator';
import { TaskActionProps, TaskContent, TaskControls } from '../building-blocks';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TaskTheme, useTaskTheme } from '@/components/tasks/theme';
import { AlertTriangle, UnplugIcon } from 'lucide-react';
import { useGiveawayParticipation } from '@/components/sweepstakes/giveaway-participation-context';
import { useProcedure } from '@/lib/mrpc/hook';
import login from '@/procedures/auth/login';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { isMissingScopes, ProviderSchema } from '@/schemas/user';
import {
  TASK_PLATFORM,
  TASK_PLATFORM_LABEL,
  TASK_REQUIRED_SCOPES,
  TaskSchema
} from '@/schemas/tasks/schemas';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const useProviderConnection = ({
  taskId,
  providerId,
  providerLabel
}: {
  taskId: string;
  providerId: string;
  providerLabel: string;
}) => {
  const pathname = usePathname();

  const loginProcedure = useProcedure({
    action: login,
    onSuccess: () => {
      toast.success(`${providerLabel} connected`);
    }
  });

  const { userProfile } = useGiveawayParticipation();
  const provider = useMemo(() => {
    return userProfile?.providers.find((p) => p.type === providerId);
  }, [userProfile?.providers]);

  const connect = () => {
    const params = new URLSearchParams();
    // add task id to params to complete the task after login
    params.append('taskId', taskId);
    const redirectTo = `${pathname}?${params.toString()}`;

    // Redirect to login with twitter
    return loginProcedure.run({
      provider: providerId,
      revalidate: 'true',
      redirectTo
    });
  };

  return { connect, provider };
};

export const WithProviderConnection: React.FC<
  TaskActionProps<TaskSchema> & {
    render: (ctx: {
      theme: TaskTheme;
      provider: ProviderSchema;
    }) => React.ReactNode;
    disabled?: boolean;
  }
> = ({ render, onSubmit, onCancel, task, disabled, isLoading }) => {
  const { theme } = useTaskTheme();
  const providerId = TASK_PLATFORM[task.type];
  const providerLabel = TASK_PLATFORM_LABEL[providerId];
  const requiredScopes = TASK_REQUIRED_SCOPES[providerId];
  const { connect, provider } = useProviderConnection({
    taskId: task.id,
    providerId,
    providerLabel
  });

  const loginProcedure = useProcedure({
    action: login,
    onSuccess: () => {
      toast.success(`${providerLabel} connected`);
    }
  });

  const isMissing = isMissingScopes(provider, requiredScopes);

  const isConnected = provider && !isMissing;

  return (
    <>
      <TaskContent className="flex flex-col items-center text-center gap-2">
        {isConnected ? (
          render({ provider, theme })
        ) : (
          <>
            <Button
              type="button"
              className={cn(theme.action)}
              onClick={connect}
              disabled={isConnected || loginProcedure.isLoading}
            >
              <UnplugIcon />
              {!!provider ? 'Reconnect' : 'Connect'}
            </Button>
            {!provider && (
              <p className="text-sm text-muted-foreground mt-2">
                Connect to {providerLabel} to continue.
              </p>
            )}
            {Boolean(provider && isMissing) && (
              <IsMissingPermissions providerLabel={providerLabel} />
            )}
          </>
        )}
      </TaskContent>
      <Separator />
      <TaskControls
        disabled={disabled || !provider || loginProcedure.isLoading}
        isLoading={isLoading}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </>
  );
};

const IsMissingPermissions: React.FC<{
  providerLabel: string;
}> = ({ providerLabel }) => {
  return (
    <Alert variant="error" className="text-left">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Missing Permissions</AlertTitle>
      <AlertDescription>
        Some required {providerLabel} permissions are missing. Please reconnect
        your account to continue.
      </AlertDescription>
    </Alert>
  );
};
