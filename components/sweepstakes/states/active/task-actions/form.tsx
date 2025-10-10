import { assertNever } from '@/lib/errors';
import { VisitUrlTaskActionForm } from './lib/visit-url';
import { BonusTaskActionForm } from './lib/bonus-task';
import { TaskActionProps } from './building-blocks';
import { TwitterConnectTaskActionForm } from './lib/twitter/twitter-connect';
import { TwitterFollowTaskActionForm } from './lib/twitter/twitter-follow';
import { TwitterRetweetTaskActionForm } from './lib/twitter/twitter-retweet';

export const TaskActionForm: React.FC<TaskActionProps> = (props) => {
  switch (props.task.type) {
    case 'BONUS_TASK':
      return <BonusTaskActionForm {...props} task={props.task} />;
    case 'VISIT_URL':
      return <VisitUrlTaskActionForm {...props} task={props.task} />;
    case 'TWITTER_CONNECT':
      return <TwitterConnectTaskActionForm {...props} task={props.task} />;
    case 'TWITTER_FOLLOW':
      return <TwitterFollowTaskActionForm {...props} task={props.task} />;
    case 'TWITTER_RETWEET':
      return <TwitterRetweetTaskActionForm {...props} task={props.task} />;

    default:
      throw assertNever(props.task);
  }
};
