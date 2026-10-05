import {
  TASK_PLATFORM,
  TaskPlatformSchema,
  TaskType
} from '@giveaway/task-model/schemas';
import { TemplateDetailsSchema } from '../schemas/template';

export function getTemplatePlatforms(
  template: TemplateDetailsSchema
): TaskPlatformSchema[] {
  const platformSet = new Set<TaskPlatformSchema>();

  for (const task of template.tasks) {
    const taskType = task.type as TaskType;
    const platform = TASK_PLATFORM[taskType];

    if (platform && platform !== 'BONUS' && platform !== 'QUESTION') {
      platformSet.add(platform);
    }
  }

  return Array.from(platformSet);
}
