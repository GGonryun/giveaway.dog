import 'server-only';

import db from '@giveaway/db-client/prisma';
import type {
  DiscordButtonInteractionSchema,
  DiscordMemberSchema
} from '@giveaway/discord-model/schema';

type ValidateEntryResult =
  | { valid: false; content: string; flags?: number }
  | {
      valid: true;
      discordUserId: string;
      member: DiscordMemberSchema;
      existingUserId: string | null;
    };

export async function validateEntry({
  body,
  taskId,
  roles,
  sweepstakesId
}: {
  body: DiscordButtonInteractionSchema;
  taskId: string;
  roles: string[];
  sweepstakesId: string;
}): Promise<ValidateEntryResult> {
  'use step';

  if (!body.guild_id) {
    return {
      valid: false,
      content: 'This interaction must be used in a server.'
    };
  }

  const discordUserId = body.member?.user?.id || body.user?.id;
  if (!discordUserId) {
    return {
      valid: false,
      content: 'Unable to identify your Discord account.'
    };
  }

  const userRoleIds = body.member?.roles || [];
  const hasEveryoneRole = roles.includes(body.guild_id);
  const hasRequiredRoles =
    roles.length === 0 ||
    hasEveryoneRole ||
    roles.some((roleId) => userRoleIds.includes(roleId));

  if (!hasRequiredRoles) {
    return {
      valid: false,
      content:
        'You are missing one or more required roles to enter this giveaway.'
    };
  }

  if (!body.member) {
    return {
      valid: false,
      content: 'You must be a member of this server to enter.'
    };
  }

  const user = await db.user.findFirst({
    where: {
      accounts: {
        some: {
          provider: 'discord',
          providerAccountId: discordUserId
        }
      }
    },
    select: {
      id: true,
      participation: {
        where: { sweepstakesId },
        select: {
          taskCompletions: {
            where: { taskId },
            select: { id: true }
          }
        }
      }
    }
  });

  if (user?.participation.some((p) => p.taskCompletions.length > 0)) {
    return { valid: false, content: "You've already entered this giveaway!" };
  }

  return {
    valid: true,
    discordUserId,
    member: body.member,
    existingUserId: user?.id ?? null
  };
}
