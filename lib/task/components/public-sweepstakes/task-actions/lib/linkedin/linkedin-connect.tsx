import { TaskActionProps } from '../../building-blocks';
import Link from 'next/link';
import { WithProviderConnection } from '../provider-connection';
import { LinkedInConnectTaskSchema } from '@/lib/task/schemas';

export const LinkedInConnectTaskActionForm: React.FC<
  TaskActionProps<LinkedInConnectTaskSchema>
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
