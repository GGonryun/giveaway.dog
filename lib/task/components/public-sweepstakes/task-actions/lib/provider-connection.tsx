import {
  TaskActionProps,
  TaskContent,
  TaskControls,
  TaskControlsProps
} from '../building-blocks';
import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useGiveawayParticipation } from '@/components/sweepstakes/giveaway-participation-context';
import { usePathname } from 'next/navigation';

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  IDENTITY_PROVIDER_LABEL,
  ProviderSchema,
  isMissingScopes
} from '@/lib/integrations/schemas/providers';
import { TaskTheme, useTaskTheme } from '@/lib/task/components/theme';
import {
  TaskSchema,
  TASK_REQUIRED_SCOPES,
  TASK_IDENTITY_PROVIDER
} from '@/lib/task/schemas';
import { LoginOptions } from '@/components/auth/login-options';

const useProviderConnection = ({ task }: { task: TaskSchema }) => {
  const { participant } = useGiveawayParticipation();
  const pathname = usePathname();

  const providerId = TASK_IDENTITY_PROVIDER[task.type];
  const providerLabel = IDENTITY_PROVIDER_LABEL[providerId];

  const provider = useMemo(() => {
    return participant?.user.providers.find((p) => p.type === providerId);
  }, [participant?.user.providers, providerId]);

  const redirectTo = useMemo(() => {
    const params = new URLSearchParams();
    // add task id to params to complete the task after login
    params.append('taskId', task.id);
    return `${pathname}?${params.toString()}`;
  }, [pathname, task.id]);

  const requiredScopes = TASK_REQUIRED_SCOPES[providerId];

  const isIncomplete = isMissingScopes(provider, requiredScopes);

  const requiresConnection =
    !('validation' in task) || task.validation?.type !== 'NONE';

  const isConnected = !requiresConnection || (provider && !isIncomplete);

  return {
    providerId,
    providerLabel,
    provider,
    isIncomplete,
    requiresConnection,
    isConnected,
    redirectTo
  };
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
  submission,
  cancel
}) => {
  const { theme } = useTaskTheme();

  const {
    redirectTo,
    isConnected,
    provider,
    isIncomplete,
    requiresConnection,
    providerId,
    providerLabel
  } = useProviderConnection({
    task
  });

  return (
    <>
      <TaskContent className="flex flex-col items-center text-center gap-2">
        {isConnected ? (
          render({ provider, theme })
        ) : (
          <>
            <LoginOptions
              label={`Connect to ${providerLabel} to continue.`}
              className={'text-left'}
              redirectTo={redirectTo}
              returnTo={redirectTo}
              allowedIdentities={[providerId]}
              type="pill"
            />
            {Boolean(provider && isIncomplete) && (
              <IsMissingPermissions providerLabel={providerLabel} />
            )}
          </>
        )}
      </TaskContent>
      <TaskControls
        disabled={disabled || (requiresConnection && !provider)}
        submission={submission}
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
