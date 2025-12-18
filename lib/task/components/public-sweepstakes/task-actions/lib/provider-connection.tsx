import { Separator } from '@/components/ui/separator';
import {
  TaskActionProps,
  TaskContent,
  TaskControls,
  TaskControlsProps
} from '../building-blocks';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AlertTriangle, UnplugIcon } from 'lucide-react';
import { useGiveawayParticipation } from '@/components/sweepstakes/giveaway-participation-context';
import { useProcedure } from '@/lib/mrpc/hook';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  ProviderSchema,
  isIdentityProvider,
  isMissingScopes
} from '@/lib/integrations/schemas/providers';
import { TaskTheme, useTaskTheme } from '@/lib/task/components/theme';
import {
  TaskSchema,
  TASK_PLATFORM,
  TASK_PLATFORM_LABEL,
  TASK_REQUIRED_SCOPES,
  TaskPlatformSchema
} from '@/lib/task/schemas';
import login from '@/lib/auth/procedures/login';
import { ApplicationError } from '@/lib/errors';

const useProviderConnection = ({
  taskId,
  providerId,
  providerLabel
}: {
  taskId: string;
  providerId: TaskPlatformSchema;
  providerLabel: string;
}) => {
  const pathname = usePathname();

  const loginProcedure = useProcedure({
    action: login,
    onSuccess: () => {
      toast.success(`${providerLabel} connected`);
    }
  });

  const { participant } = useGiveawayParticipation();
  const provider = useMemo(() => {
    return participant?.user.providers.find((p) => p.type === providerId);
  }, [participant?.user.providers]);

  const connect = () => {
    const params = new URLSearchParams();
    // add task id to params to complete the task after login
    params.append('taskId', taskId);
    const redirectTo = `${pathname}?${params.toString()}`;

    if (!isIdentityProvider(providerId)) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: `Unsupported provider ${providerId}`
      });
    }

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
  Omit<TaskActionProps<TaskSchema>, 'entrants' | 'loyalty'> &
    Pick<TaskControlsProps, 'submit' | 'cancel' | 'disabled'> & {
      hidden?: boolean;
      render: (ctx: {
        theme: TaskTheme;
        provider: ProviderSchema | undefined;
      }) => React.ReactNode;
    }
> = ({
  render,
  onSubmit,
  onCancel,
  task,
  disabled,
  isLoading,
  submit,
  cancel
}) => {
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

  const requiresConnection =
    !('validation' in task) || task.validation?.type !== 'NONE';
  const isConnected = !requiresConnection || (provider && !isMissing);

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
        disabled={
          disabled ||
          (requiresConnection && (!provider || loginProcedure.isLoading))
        }
        isLoading={isLoading}
        submit={submit}
        cancel={cancel}
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
    <Alert variant="destructive" className="text-left">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Missing Permissions</AlertTitle>
      <AlertDescription>
        Some required {providerLabel} permissions are missing. Please reconnect
        your account to continue.
      </AlertDescription>
    </Alert>
  );
};
