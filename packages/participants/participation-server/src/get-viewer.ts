'use server';

import { procedure } from '@giveaway/rpc-server/procedures';
import {
  toUserSchema,
  USER_SCHEMA_SELECT_QUERY,
  userSchema
} from '@giveaway/user-model/user';

export const getViewer = procedure()
  .authorization({ required: false })
  .output(userSchema.optional())
  .handler(async ({ db, user }) => {
    if (!user?.id) return undefined;

    const viewer = await db.user.findUnique({
      where: { id: user.id },
      select: USER_SCHEMA_SELECT_QUERY
    });

    return viewer ? toUserSchema(viewer) : undefined;
  });
