import 'server-only';

import {
  toUserSchema,
  USER_SCHEMA_SELECT_QUERY
} from '@giveaway/user-model/user';
import { PrismaClient } from '@giveaway/db-model';

export const getUserQuery = async (db: PrismaClient, userId: string) => {
  const userData = await db.user.findUnique({
    where: { id: userId },
    select: USER_SCHEMA_SELECT_QUERY
  });

  if (!userData) {
    return null;
  }

  return toUserSchema(userData);
};
