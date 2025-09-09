import z from 'zod';

export const baseTaskSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string().min(1, 'Title is required'),
  value: z.number().min(1, 'Minimum value is 1'),
  mandatory: z.boolean(),
  tasksRequired: z.number()
});

export const bonusTaskSchema = baseTaskSchema.extend({
  type: z.literal('BONUS_TASK')
});
export type BonusTaskSchema = z.infer<typeof bonusTaskSchema>;

export const visitUrlTaskSchema = baseTaskSchema.extend({
  type: z.literal('VISIT_URL'),
  href: z.string().url(),
  label: z.string().min(3, 'Label is required')
});

export type VisitUrlTaskSchema = z.infer<typeof visitUrlTaskSchema>;

export const taskSchema = z.discriminatedUnion('type', [
  bonusTaskSchema,
  visitUrlTaskSchema
]);

export type TaskType = z.infer<typeof taskSchema>['type'];

export const TASK_GROUP: Record<TaskType, string> = {
  BONUS_TASK: 'Bonus Tasks',
  VISIT_URL: 'Visit URL Tasks'
};

export type TaskSchema = z.infer<typeof taskSchema>;

export type TaskOf<T extends TaskType> = Extract<TaskSchema, { type: T }>;
