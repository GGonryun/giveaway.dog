import db from '@/lib/prisma';
import { ApplicationError } from '@/lib/errors';
import type { DiscordButtonInteractionSchema } from '../schema';
import { DISCORD_RESPONSE_FLAG } from '../messages';
import { toSweepstakesUrl } from '@/lib/sweepstakes/util';
import { SWEEPSTAKES_DISCORD_POST_SELECT_QUERY } from '@/lib/automation/db';
import { updateDiscordMessage } from '../../api/update-discord-message';
import { toSweepstakesEmbed } from '../../embeds';
import { toExpiredSweepstakeComponents } from '../../api/util';
import { toTaskSchema } from '@/lib/task/schemas';
import { scheduleRandomlyAssignPrizesJob } from '@/lib/jobs/util';

export const processTaskEntry = async ({
  body,
  taskId
}: {
  body: DiscordButtonInteractionSchema;
  taskId: string;
}) => {
  try {
    if (!body.guild_id) {
      return {
        content: 'This interaction must be used in a server.'
      };
    }

    const discordUserId = body.member?.user?.id || body.user?.id;
    if (!discordUserId) {
      return {
        content: 'Unable to identify your Discord account.'
      };
    }

    const data = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        sweepstakes: {
          select: SWEEPSTAKES_DISCORD_POST_SELECT_QUERY
        }
      }
    });

    if (!data) {
      return {
        content: 'This giveaway task no longer exists.',
        flags: DISCORD_RESPONSE_FLAG.EPHEMERAL
      };
    }

    const { sweepstakes, ...rest } = data;
    const sweepstakesId = sweepstakes.id;
    const task = toTaskSchema(rest);

    if (task.type !== 'DISCORD_INTERACTION_IMPORT') {
      return {
        content: 'This task is not a Discord interaction entry task.',
        flags: DISCORD_RESPONSE_FLAG.EPHEMERAL
      };
    }

    if (sweepstakes.status === 'DRAFT') {
      return {
        content: 'This giveaway is not yet active.',
        flags: DISCORD_RESPONSE_FLAG.EPHEMERAL
      };
    }
    const endDate = sweepstakes.timing?.endDate;

    if (
      sweepstakes.status === 'COMPLETED' ||
      !endDate ||
      new Date(endDate) < new Date()
    ) {
      await updateDiscordMessage({
        channelId: body.message.channel_id,
        messageId: body.message.id,
        embed: await toSweepstakesEmbed({
          sweepstakes,
          db
        }),
        components: toExpiredSweepstakeComponents({
          sweepstakes
        })
      });
      return {
        content: 'This giveaway has already ended.',
        flags: DISCORD_RESPONSE_FLAG.EPHEMERAL
      };
    }

    // Find user by Discord account
    let user = await db.user.findFirst({
      where: {
        accounts: {
          some: {
            provider: 'discord',
            providerAccountId: discordUserId
          }
        }
      }
    });

    // Check if user already has a completion for this task
    if (user) {
      const existingCompletion = await db.taskCompletion.findFirst({
        where: {
          taskId,
          participant: {
            sweepstakesId,
            userId: user.id
          }
        }
      });

      if (existingCompletion) {
        return {
          content: "You've already entered this giveaway!"
        };
      }
    }

    const userRoleIds = body.member?.roles || [];
    const requiredRoleIds = task.roles || [];

    const hasEveryoneRole = requiredRoleIds.includes(body.guild_id);
    const hasRequiredRoles =
      requiredRoleIds.length === 0 ||
      hasEveryoneRole ||
      requiredRoleIds.some((roleId: string) => userRoleIds.includes(roleId));

    if (!hasRequiredRoles) {
      return {
        content: `You are missing one or more required roles to enter this giveaway.`
      };
    }

    if (!body.member) {
      return {
        content: 'You must be a member of this server to enter.'
      };
    }

    // Create user if doesn't exist
    if (!user && body.member.user) {
      const displayName =
        body.member.nick ||
        body.member.user.global_name ||
        body.member.user.username;

      const avatarUrl = body.member.user.avatar
        ? `https://cdn.discordapp.com/avatars/${body.member.user.id}/${body.member.user.avatar}.png`
        : null;

      user = await db.user.create({
        data: {
          name: displayName,
          image: avatarUrl,
          source: 'DISCORD_IMPORT',
          accounts: {
            create: {
              type: 'oauth',
              provider: 'discord',
              providerAccountId: body.member.user.id,
              access_token: null,
              refresh_token: null,
              expires_at: null,
              token_type: 'bearer',
              scope: '',
              id_token: null,
              session_state: null,
              label: body.member.user.username
            }
          }
        }
      });
    }

    if (!user) {
      return {
        content: 'Failed to create your entry. Please try again.'
      };
    }

    try {
      await db.taskCompletion.create({
        data: {
          participant: {
            connectOrCreate: {
              where: {
                userId_sweepstakesId: {
                  userId: user.id,
                  sweepstakesId
                }
              },
              create: {
                userId: user.id,
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
    } catch (error: any) {
      if (error.code === 'P2002') {
        return {
          content: "You've already entered this giveaway!"
        };
      }
      throw error;
    }

    const giveawayUrl = toSweepstakesUrl({ sweepstakes, forcePath: true });

    await updateDiscordMessage({
      channelId: body.message.channel_id,
      messageId: body.message.id,
      embed: await toSweepstakesEmbed({
        db,
        sweepstakes
      })
    });

    await scheduleRandomlyAssignPrizesJob({
      db,
      sweepstakesId
    });

    return {
      content: `Your entry is confirmed!\n[Click here for bonus entries](${giveawayUrl})`
    };
  } catch (error) {
    console.error('Error processing task entry:', error);

    if (error instanceof ApplicationError) {
      return {
        content: error.message
      };
    }

    return {
      content: 'An unexpected error occurred. Please try again later.'
    };
  }
};
