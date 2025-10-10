import { TaskActionProps } from '../../building-blocks';
import { TwitterConnectTaskSchema } from '@/schemas/tasks/schemas';
import Link from 'next/link';
import { WithTwitterConnection } from './shared';

export const TwitterConnectTaskActionForm: React.FC<
  TaskActionProps<TwitterConnectTaskSchema>
> = ({ onCancel, onSubmit, task }) => {
  return (
    <WithTwitterConnection
      task={task}
      onCancel={onCancel}
      onSubmit={onSubmit}
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
