import { IntegrationStatus } from '@prisma/client';
import prisma from '@giveaway/db-client/prisma';
import type { DiscordApplicationCommandInteractionSchema } from '../../../bot/schema';
import { toDiscordIntegrationSettings } from '@/lib/discord/integration/schemas';
import { INTEGRATIONS_SETUP_URL } from '../../../bot/util';
import { getDiscordGuildInfo } from '../../../api/get-discord-guild-name';
import type { DiscordFollowupMessage } from '../../discord-interaction/steps/patch-discord-webhook';

export type ProcessConnectResult = DiscordFollowupMessage & {
  success: boolean;
};

export async function processConnect({
  body
}: {
  body: DiscordApplicationCommandInteractionSchema;
}): Promise<ProcessConnectResult> {
  'use step';

  const flags = 64;

  try {
    if (!body.guild) {
      return {
        content:
          'The /connect command can only be used within a Discord server.',
        flags,
        success: false
      };
    }

    if (!body.channel) {
      return {
        content: 'The /connect command requires a valid channel context.',
        flags,
        success: false
      };
    }

    if (!body.member || !body.member.user) {
      return {
        content: 'The /connect command requires a valid member context.',
        flags,
        success: false
      };
    }

    const keyOption = body.data.options?.find((opt) => opt.name === 'key');
    if (!keyOption) {
      return {
        content: 'Please provide a registration key. Usage: `/connect KEY`',
        flags,
        success: false
      };
    }

    const registrationKey = keyOption.value;

    const state = await prisma.state.findFirst({
      where: { id: registrationKey },
      include: {
        integration: {
          include: { team: true }
        }
      }
    });

    if (!state) {
      return {
        content: `No pending integration found for this server. Visit ${INTEGRATIONS_SETUP_URL({ slug: undefined })} to start the setup process.`,
        flags,
        success: false
      };
    }

    const { integration } = state;
    if (!integration) {
      return {
        content:
          'No integration found for this registration key. Please regenerate your registration key and try again.',
        flags,
        success: false
      };
    }

    const { team } = integration;
    if (!team) {
      return {
        content:
          'Invalid team associated with this integration. Please contact GiveawayDog support.',
        flags,
        success: false
      };
    }

    const { slug } = team;
    if (!slug) {
      return {
        content:
          'Invalid team associated with this integration. Please contact GiveawayDog support.',
        flags,
        success: false
      };
    }

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

    return {
      embeds: [
        {
          title: 'Successfully Connected!',
          description: `Giveaway.dog is now connected to your team!\n\nYou can now update your settings any time.\n\n[Manage your integration here](${INTEGRATIONS_SETUP_URL({ slug })})`,
          color: 0x00ff00
        }
      ],
      flags,
      success: true
    };
  } catch (error) {
    console.error('Error handling /connect command:', error);
    return {
      content:
        'An error occurred while processing your request. Please try again later.',
      flags,
      success: false
    };
  }
}
