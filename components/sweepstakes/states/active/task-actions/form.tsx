import { assertNever } from '@/lib/errors';
import { VisitUrlTaskActionForm } from './lib/visit-url';
import { BonusTaskActionForm } from './lib/bonus-task';
import { TaskActionProps } from './building-blocks';
import { TwitterConnectTaskActionForm } from './lib/twitter-connect';

export const TaskActionForm: React.FC<TaskActionProps> = (props) => {
  switch (props.task.type) {
    case 'BONUS_TASK':
      return <BonusTaskActionForm {...props} task={props.task} />;
    case 'VISIT_URL':
      return <VisitUrlTaskActionForm {...props} task={props.task} />;
    case 'TWITTER_CONNECT':
      return <TwitterConnectTaskActionForm {...props} task={props.task} />;
    default:
      throw assertNever(props.task);
  }
};
