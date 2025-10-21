import {
  UserFeatureFlagKeySchema,
  TeamFeatureFlagKeySchema
} from '@/schemas/feature-flags';
import { Nil } from './types';

export namespace featureFlags {
  export const parseUser = (
    input:
      | Nil<{ featureFlags?: UserFeatureFlagKeySchema[] }>
      | Nil<UserFeatureFlagKeySchema[]>,
    flag: UserFeatureFlagKeySchema
  ): boolean => {
    if (!input) return false;
    if (Array.isArray(input)) return input.includes(flag);
    if (!input?.featureFlags) return false;
    return input.featureFlags.includes(flag);
  };

  export const parseTeam = (
    input:
      | Nil<{ featureFlags?: TeamFeatureFlagKeySchema[] }>
      | Nil<TeamFeatureFlagKeySchema[]>,
    flag: TeamFeatureFlagKeySchema
  ): boolean => {
    if (!input) return false;
    if (Array.isArray(input)) return input.includes(flag);
    if (!input?.featureFlags) return false;
    return input.featureFlags.includes(flag);
  };
}
