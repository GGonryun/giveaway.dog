import { TaskSchema } from './schemas';

export type ValidateTaskInput<T extends TaskSchema> = {
  task: T;
  userId: string;
  participantId: string;
  teamId: string;
  data?: unknown;
};
