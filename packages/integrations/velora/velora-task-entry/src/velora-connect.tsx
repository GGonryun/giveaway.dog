import { TaskActionProps } from '@giveaway/task-entry-core/building-blocks';
import Link from 'next/link';
import { WithProviderConnection } from '@giveaway/task-entry-core/provider-connection';
import { VeloraConnectTaskSchema } from '@giveaway/task-model/schemas';

export const VeloraConnectTaskActionForm: React.FC<
  TaskActionProps<VeloraConnectTaskSchema>
> = ({ onCancel, onSubmit, submission, task, isLoading }) => {
  return (
    <WithProviderConnection
      task={task}
      submission={submission}
      onCancel={onCancel}
      onSubmit={onSubmit}
      isLoading={isLoading}
      render={({ provider }) => (
        <p className="text-sm text-foreground mt-2">
          You are connected as{' '}
          <Link href={'/account'} className="underline">
            {provider?.label.toLocaleLowerCase()}
          </Link>
          .
        </p>
      )}
    />
  );
};
