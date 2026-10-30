import 'server-only';

import db from '@giveaway/db-client/prisma';
import { Prisma } from '@giveaway/db-model';
import { ensureScoringDrain } from '@giveaway/scoring-jobs/scoring-drain/ensure';
import type {
  DiscordButtonInteractionSchema,
  DiscordMemberSchema
} from '@giveaway/discord-model/schema';

const isUniqueConstraintError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2002';

const findDiscordUserId = async (discordUserId: string) => {
  const account = await db.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: 'discord',
        providerAccountId: discordUserId
      }
    },
    select: { userId: true }
  });
  return account?.userId ?? null;
};

const importDiscordUser = async (
  member: DiscordMemberSchema,
  discordUserId: string
) => {
  const existing = await findDiscordUserId(discordUserId);
  if (existing) {
    await ensureScoringDrain();
    return existing;
  }
  if (!member.user) {
    return null;
  }

  const displayName =
    member.nick || member.user.global_name || member.user.username;

  const avatarUrl = member.user.avatar
    ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png`
    : null;

  const label = member.user.username;

  try {
    const user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({
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
              label
            }
          }
        }
      });
      await tx.userScoringRequest.create({
        data: { userId: created.id }
      });
      return created;
    });
    await ensureScoringDrain();
    return user.id;
  } catch (error: unknown) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }
    const imported = await findDiscordUserId(discordUserId);
    if (!imported) {
      throw error;
    }
    await ensureScoringDrain();
    return imported;
  }
};

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

  const userId =
    existingUserId || (await importDiscordUser(member, discordUserId));

  if (!userId) {
    throw new Error('Failed to resolve user for entry commit.');
  }

  const userRoleIds = body.member?.roles || [];

  await db.$transaction(async (tx) => {
    const participant = await tx.sweepstakesParticipant.upsert({
      where: { userId_sweepstakesId: { userId, sweepstakesId } },
      create: { userId, sweepstakesId },
      update: {},
      select: { id: true }
    });

    await tx.$executeRaw`SELECT id FROM "Participant" WHERE id = ${participant.id} FOR UPDATE`;

    const completion = await tx.taskCompletion.findFirst({
      where: { participantId: participant.id, taskId },
      select: { id: true }
    });
    if (completion) {
      console.log('Duplicate entry detected — already recorded, ignoring.');
      return;
    }

    await tx.taskCompletion.create({
      data: {
        participantId: participant.id,
        taskId,
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
  });

  return { userId };
}
