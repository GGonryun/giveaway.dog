import { ShieldCheck } from 'lucide-react';
import {
  TASK_VERIFICATION_REQUIREMENT,
  TaskType
} from '@giveaway/task-model/schemas';
import { SelectTaskBadge } from './select-task-badge';
import { assertNever } from '@giveaway/util-errors';

export const VerificationBadge: React.FC<{ type: TaskType }> = ({ type }) => {
  const verification = TASK_VERIFICATION_REQUIREMENT[type];

  switch (verification) {
    case 'automatic':
      return (
        <SelectTaskBadge
          variant="success"
          Icon={ShieldCheck}
          label="Verified"
        />
      );
    // to prevent being too noisy
    case 'manual':
    case 'self-reported':
      return null;
    default:
      throw assertNever(verification);
  }
};
