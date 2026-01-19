import { IntegrationStatus } from '@prisma/client';
import prisma from '@/lib/prisma';
import { toEphemeralChannelResponse } from '../messages';
import { DiscordApplicationCommandInteractionSchema } from '../schema';
import { toDiscordIntegrationSettings } from '@/lib/discord/integration/schemas';
import { INTEGRATIONS_SETUP_URL } from '../util';
import { getDiscordGuildInfo } from '../../api/get-discord-guild-name';

export const handleConnectCommand = async (
  body: DiscordApplicationCommandInteractionSchema
) => {
  try {
    if (!body.guild) {
      return toEphemeralChannelResponse({
        content:
          'The /connect command can only be used within a Discord server.'
      });
    }

    if (!body.channel) {
      return toEphemeralChannelResponse({
        content: 'The /connect command requires a valid channel context.'
      });
    }

    if (!body.member || !body.member.user) {
      return toEphemeralChannelResponse({
        content: 'The /connect command requires a valid member context.'
      });
    }

    const keyOption = body.data.options?.find((opt) => opt.name === 'key');
    if (!keyOption) {
      return toEphemeralChannelResponse({
        content: `Please provide a registration key. Usage: \`/connect KEY\``
      });
    }

    const registrationKey = keyOption.value;

    const state = await prisma.state.findFirst({
      where: {
        id: registrationKey
      },
      include: {
        integration: {
          include: {
            team: true
          }
        }
      }
    });

    if (!state) {
      return toEphemeralChannelResponse({
        content: `No pending integration found for this server. Visit ${INTEGRATIONS_SETUP_URL({ slug: undefined })} to start the setup process.`
      });
    }

    const { integration } = state;
    if (!integration) {
      return toEphemeralChannelResponse({
        content: `No integration found for this registration key. Please regenerate your registration key and try again.`
      });
    }

    const { team } = integration;
    if (!team) {
      return toEphemeralChannelResponse({
        content: `Invalid team associated with this integration. Please contact GiveawayDog support.`
      });
    }

    const { slug } = team;
    if (!slug) {
      return toEphemeralChannelResponse({
        content: `Invalid team associated with this integration. Please contact GiveawayDog support.`
      });
    }

    const channelId = body.channel.id;
    const settings = toDiscordIntegrationSettings(body);

    const guild = await getDiscordGuildInfo(body.guild.id);

    await prisma.integration.update({
      where: { id: integration.id },
      data: {
        account_id: body.guild.id,
        label: guild.name,
        status: IntegrationStatus.ACTIVE,
        settings
      }
    });

    return toEphemeralChannelResponse({
      embeds: [
        {
          title: 'Successfully Connected!',
          description: `Giveaway.dog is now connected to your team!\n\nGiveaways will be posted in <#${channelId}>.\n\nYou can now update your settings any time at ${INTEGRATIONS_SETUP_URL({ slug })}.`,
          color: 0x00ff00
        }
      ]
    });
  } catch (error) {
    console.error('Error handling /connect command:', error);
    return toEphemeralChannelResponse({
      content:
        'An error occurred while processing your request. Please try again later.'
    });
  }
};
