import {
  TaskType,
  TASK_VERIFICATION_REQUIREMENT,
  TASK_IDENTITY_PROVIDER
} from '../schemas';
import { ProviderSchema } from '@giveaway/integration-model/providers';

export function isTaskVerifiable(taskType: TaskType): boolean {
  const requirement = TASK_VERIFICATION_REQUIREMENT[taskType];
  return requirement === 'automatic' || requirement === 'manual';
}

export function supportsAutomatedReverification(taskType: TaskType): boolean {
  return TASK_VERIFICATION_REQUIREMENT[taskType] === 'automatic';
}

export function requiresManualVerification(taskType: TaskType): boolean {
  return TASK_VERIFICATION_REQUIREMENT[taskType] === 'manual';
}

export const getProviderByTask = (
  taskType: TaskType,
  userProviders: ProviderSchema[]
): ProviderSchema | null => {
  const key = TASK_IDENTITY_PROVIDER[taskType];
  const provider = userProviders.find((p) => p.type === key);
  return provider || null;
};

export function getProviderLink(
  taskType: TaskType,
  userProviders: ProviderSchema[]
): string | null {
  const key = TASK_IDENTITY_PROVIDER[taskType];
  const provider = userProviders.find((p) => p.type === key);

  return provider?.link || null;
}

export function getProviderLabel(
  taskType: TaskType,
  userProviders: ProviderSchema[]
): string | null {
  const key = TASK_IDENTITY_PROVIDER[taskType];
  const provider = userProviders.find((p) => p.type === key);
  return provider?.label || null;
}
