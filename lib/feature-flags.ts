import { FeatureFlagKeySchema } from '@/schemas/feature-flags';
import { Nil } from './types';

export namespace featureFlags {
  export const parse = (
    input:
      | Nil<{ featureFlags?: FeatureFlagKeySchema[] }>
      | Nil<FeatureFlagKeySchema[]>,
    flag: FeatureFlagKeySchema
  ): boolean => {
    if (!input) return false;
    if (Array.isArray(input)) return input.includes(flag);
    if (!input?.featureFlags) return false;
    return input.featureFlags.includes(flag);
  };
}
