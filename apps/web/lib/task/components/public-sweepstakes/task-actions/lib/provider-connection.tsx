import {
  TaskActionProps,
  TaskContent,
  TaskControls,
  TaskControlsProps
} from '../building-blocks';
import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTaskEntry } from './task-entry-context';
import { usePathname } from 'next/navigation';

import {
  Alert,
  AlertTitle,
  AlertDescription
} from '@giveaway/ui-primitives/alert';
import {
  IDENTITY_PROVIDER_LABEL,
  ProviderSchema,
  isMissingScopes
} from '@giveaway/integration-model/providers';
import { TaskTheme, useTaskTheme } from '@giveaway/task-ui/theme';
import {
  TaskSchema,
  TASK_REQUIRED_SCOPES,
  TASK_IDENTITY_PROVIDER
} from '@giveaway/task-model/schemas';
import { LoginOptions } from '@/components/auth/login-options';
import { AccountStatusAlert } from '@/components/auth/account-status-alert';

const useProviderConnection = ({ task }: { task: TaskSchema }) => {
  const { providers } = useTaskEntry();
  const pathname = usePathname();

  const providerId = TASK_IDENTITY_PROVIDER[task.type];
  const providerLabel = IDENTITY_PROVIDER_LABEL[providerId];

  const provider = useMemo(() => {
    return providers?.find((p) => p.type === providerId);
  }, [providers, providerId]);

  const redirectTo = useMemo(() => {
    const params = new URLSearchParams();
    // add task id to params to complete the task after login
    params.append('taskId', task.id);
    return `${pathname}?${params.toString()}`;
  }, [pathname, task.id]);

  const requiredScopes = TASK_REQUIRED_SCOPES[providerId];

  const isIncomplete = isMissingScopes(provider, requiredScopes);
  const isError = provider?.status === 'ERROR';

  const requiresConnection =
    !('validation' in task) || task.validation?.type !== 'NONE';

  const isConnected =
    !requiresConnection || (provider && !isIncomplete && !isError);

  return {
    providerId,
    providerLabel,
    provider,
    isIncomplete,
    isError,
    requiresConnection,
    isConnected,
    redirectTo
  };
};

export const WithProviderConnection: React.FC<
  Omit<TaskActionProps<TaskSchema>, 'entrants' | 'loyalty' | 'onUpdate'> &
    Pick<TaskControlsProps, 'submit' | 'cancel' | 'disabled'> & {
      hidden?: boolean;
      hideControls?: boolean;
      onUpdate?: (data?: unknown) => void;
      render: (ctx: {
        theme: TaskTheme;
        provider: ProviderSchema | undefined;
      }) => React.ReactNode;
    }
> = ({
  render,
  onSubmit,
  onUpdate,
  onCancel,
  task,
  disabled,
  isLoading,
  submit,
  submission,
  cancel,
  hideControls
}) => {
  const { theme } = useTaskTheme();

  const {
    redirectTo,
    isConnected,
    provider,
    isIncomplete,
    isError,
    requiresConnection,
    providerId,
    providerLabel
  } = useProviderConnection({
    task
  });

  const { providers } = useTaskEntry();

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
              userProviders={providers}
            />
            {Boolean(provider && isIncomplete) && (
              <IsMissingPermissions providerLabel={providerLabel} />
            )}
            {Boolean(provider && isError) && (
              <AccountStatusAlert
                status="ERROR"
                providerLabel={providerLabel}
              />
            )}
          </>
        )}
      </TaskContent>
      {!hideControls && (
        <TaskControls
          disabled={disabled || (requiresConnection && !provider)}
          submission={submission}
          isLoading={isLoading}
          submit={submit}
          cancel={cancel}
          onUpdate={onUpdate}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )}
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
