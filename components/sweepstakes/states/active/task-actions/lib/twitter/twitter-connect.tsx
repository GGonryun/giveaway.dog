import { TaskActionProps } from '../../building-blocks';
import { TwitterConnectTaskSchema } from '@/schemas/tasks/schemas';
import Link from 'next/link';
import { WithProviderConnection } from '../provider-connection';

export const TwitterConnectTaskActionForm: React.FC<
  TaskActionProps<TwitterConnectTaskSchema>
> = ({ onCancel, onSubmit, task, isLoading }) => {
  return (
    <WithProviderConnection
      task={task}
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
