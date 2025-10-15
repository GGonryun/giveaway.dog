import { FeatureFlagKeySchema } from '@/schemas/feature-flags';
import { Nil } from './types';

export namespace featureFlags {
  export const parse = (
    user: Nil<{ featureFlags?: FeatureFlagKeySchema[] }>,
    flag: FeatureFlagKeySchema
  ): boolean => {
    if (!user?.featureFlags) return false;
    return user.featureFlags.includes(flag);
  };
}
