import { UserAccountType } from '@prisma/client';
import {
  UserFeatureFlagKeySchema,
  HOST_DASHBOARD_FEATURE_FLAG_KEY
} from '@/schemas/feature-flags';
import { Nil } from './types';

export namespace featureFlags {
  export const parseUser = (
    input: Nil<{ accountType?: UserAccountType }>,
    flag: UserFeatureFlagKeySchema
  ): boolean => {
    if (!input) return false;
    if (flag === HOST_DASHBOARD_FEATURE_FLAG_KEY) {
      return input.accountType === UserAccountType.HOST;
    }
    return true;
  };
}
