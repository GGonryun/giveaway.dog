import 'server-only';

import db from '@giveaway/db-client/prisma';
import type {
  DiscordButtonInteractionSchema,
  DiscordMemberSchema
} from '@giveaway/discord-model/schema';

export async function commitEntry({
  body,
  taskId,
  sweepstakesId,
  existingUserId,
  member,
  discordUserId
}: {
  body: DiscordButtonInteractionSchema;
  taskId: string;
  sweepstakesId: string;
  existingUserId: string | null;
  member: DiscordMemberSchema;
  discordUserId: string;
}): Promise<{ userId: string }> {
  'use step';

  let userId = existingUserId;

  if (!userId && member.user) {
    const displayName =
      member.nick || member.user.global_name || member.user.username;

    const avatarUrl = member.user.avatar
      ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png`
      : null;

    const user = await db.user.create({
      data: {
        name: displayName,
        image: avatarUrl,
        source: 'DISCORD_IMPORT',
        accounts: {
          create: {
            type: 'oauth',
            provider: 'discord',
            providerAccountId: discordUserId,
            access_token: null,
            refresh_token: null,
            expires_at: null,
            token_type: 'bearer',
            scope: '',
            id_token: null,
            session_state: null,
            label: member.user.username
          }
        }
      }
    });

    await db.userScoringRequest.create({
      data: { userId: user.id }
    });

    userId = user.id;
  }

  if (!userId) {
    throw new Error('Failed to resolve user for entry commit.');
  }

  const userRoleIds = body.member?.roles || [];

  try {
    await db.taskCompletion.create({
      data: {
        participant: {
          connectOrCreate: {
            where: {
              userId_sweepstakesId: {
                userId,
                sweepstakesId
              }
            },
            create: {
              userId,
              sweepstakesId
            }
          }
        },
        task: {
          connect: { id: taskId }
        },
        status: 'COMPLETED',
        proof: {
          discordGuildId: body.guild_id,
          discordChannelId: body.message.channel_id,
          discordMessageId: body.message.id,
          userRoles: userRoleIds,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      console.log(
        'Duplicate entry detected (P2002) — confirmation already sent, ignoring.'
      );
    } else {
      throw error;
    }
  }

  return { userId };
}
