import prisma from '@/lib/prisma';
import { ApplicationError } from '@/lib/errors';
import type { DiscordButtonInteractionSchema } from '../schema';
import { getDiscordGuildRoles } from '@/lib/discord/api/get-discord-guild-roles';
import { DISCORD_RESPONSE_FLAG } from '../messages';
import { toSweepstakesUrl } from '@/lib/sweepstakes/util';
import { SWEEPSTAKES_DISCORD_POST_SELECT_QUERY } from '@/lib/automation/db';
import { updateDiscordMessage } from '../../api/update-discord-message';
import { toGiveawayExpiredEmbed } from '@/lib/automation/util';

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

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        sweepstakes: {
          select: SWEEPSTAKES_DISCORD_POST_SELECT_QUERY
        }
      }
    });

    if (!task) {
      return {
        content: 'This giveaway task no longer exists.',
        flags: DISCORD_RESPONSE_FLAG.EPHEMERAL
      };
    }

    if (task.sweepstakes.status === 'COMPLETED') {
      await updateDiscordMessage({
        channelId: body.message.channel_id,
        messageId: body.message.id,
        embed: toGiveawayExpiredEmbed(task.sweepstakes),
        components: []
      });
      return {
        content: 'This giveaway has already ended.',
        flags: DISCORD_RESPONSE_FLAG.EPHEMERAL
      };
    }

    if (task.sweepstakes.status === 'DRAFT') {
      return {
        content: 'This giveaway is not yet active.',
        flags: DISCORD_RESPONSE_FLAG.EPHEMERAL
      };
    }

    const endDate = task.sweepstakes.timing?.endDate;
    if (!endDate || new Date(endDate) < new Date()) {
      return {
        content: 'This giveaway has already ended.',
        flags: DISCORD_RESPONSE_FLAG.EPHEMERAL
      };
    }

    // Find user by Discord account
    let user = await prisma.user.findFirst({
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
      const existingCompletion = await prisma.taskCompletion.findFirst({
        where: {
          taskId,
          participant: {
            sweepstakesId: task.sweepstakesId,
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
    const taskData = task.config as any;
    const requiredRoleIds = taskData.roles || [];

    const hasEveryoneRole = requiredRoleIds.includes(body.guild_id);
    const hasRequiredRoles =
      requiredRoleIds.length === 0 ||
      hasEveryoneRole ||
      requiredRoleIds.some((roleId: string) => userRoleIds.includes(roleId));

    if (!hasRequiredRoles) {
      let roleNames: string[] = [];
      try {
        const roles = await getDiscordGuildRoles(body.guild_id);
        roleNames = requiredRoleIds
          .map((id: string) => roles.find((r) => r.id === id)?.name)
          .filter((name: string | undefined): name is string => Boolean(name));
      } catch (error) {
        console.error('Failed to fetch role names:', error);
      }

      const roleList =
        roleNames.length > 0 ? roleNames.join(', ') : 'the required role';

      return {
        content: `You need ${roleList} to enter this giveaway.`
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

      user = await prisma.user.create({
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
              session_state: null
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
      await prisma.taskCompletion.create({
        data: {
          participant: {
            connectOrCreate: {
              where: {
                userId_sweepstakesId: {
                  userId: user.id,
                  sweepstakesId: task.sweepstakesId
                }
              },
              create: {
                userId: user.id,
                sweepstakesId: task.sweepstakesId
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

    const giveawayUrl = toSweepstakesUrl(task.sweepstakes);

    return {
      content: `You're entry is confirmed! Unlock bonus entries 👉 ${giveawayUrl}`
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
