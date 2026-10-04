import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processConnect } from '../process-connect';
import { prismaMock } from '@giveaway/testing-server/prisma';
import type { DiscordApplicationCommandInteractionSchema } from '@giveaway/discord-model/schema';
import {
  commandInteraction,
  discordChannel,
  discordGuild,
  discordMember,
  jsonResponse
} from '@giveaway/discord-model/testing/fixtures-discord-procedures-workflows';

const APP_URL = 'https://app.giveaway.test';

const GENERIC_ERROR = {
  content:
    'An error occurred while processing your request. Please try again later.',
  flags: 64,
  success: false
};

const INVALID_TEAM = {
  content:
    'Invalid team associated with this integration. Please contact GiveawayDog support.',
  flags: 64,
  success: false
};

const stateWith = (integration: unknown) => ({
  id: 'state-1',
  value: {},
  integration
});

const activeState = () =>
  stateWith({
    id: 'integration-1',
    team: { id: 'team-1', slug: 'acme' }
  });

const guildInfo = {
  id: 'guild-1',
  name: 'Doggo Server',
  icon: null,
  owner_id: 'owner-1'
};

const withData = (
  data: Partial<DiscordApplicationCommandInteractionSchema['data']>
) =>
  commandInteraction({
    data: { id: 'command-1', name: 'connect', type: 1, ...data }
  });

const splitGuildIds = () =>
  commandInteraction({
    guild: discordGuild({ id: 'guild-object' }),
    guild_id: 'guild-top-level'
  });

describe('processConnect', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const consoleError = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', APP_URL);
    vi.spyOn(console, 'error').mockImplementation(consoleError);
    fetchMock.mockReset();
    consoleError.mockReset();
    fetchMock.mockResolvedValue(jsonResponse(guildInfo));
    prismaMock.state.findFirst.mockResolvedValue(activeState());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('when the interaction context is incomplete', () => {
    it('rejects a command used outside a server', async () => {
      const result = await processConnect({
        body: commandInteraction({ guild: undefined })
      });

      expect(result).toEqual({
        content:
          'The /connect command can only be used within a Discord server.',
        flags: 64,
        success: false
      });
      expect(prismaMock.state.findFirst).not.toHaveBeenCalled();
    });

    it('rejects a command without a channel', async () => {
      const result = await processConnect({
        body: commandInteraction({ channel: undefined })
      });

      expect(result).toEqual({
        content: 'The /connect command requires a valid channel context.',
        flags: 64,
        success: false
      });
      expect(prismaMock.state.findFirst).not.toHaveBeenCalled();
    });

    it('rejects a command without a member', async () => {
      const result = await processConnect({
        body: commandInteraction({ member: undefined })
      });

      expect(result).toEqual({
        content: 'The /connect command requires a valid member context.',
        flags: 64,
        success: false
      });
      expect(prismaMock.state.findFirst).not.toHaveBeenCalled();
    });

    it('rejects a command whose member has no user', async () => {
      const member = {
        ...discordMember(),
        user: undefined
      } as unknown as ReturnType<typeof discordMember>;

      const result = await processConnect({
        body: commandInteraction({ member })
      });

      expect(result).toEqual({
        content: 'The /connect command requires a valid member context.',
        flags: 64,
        success: false
      });
    });

    it('asks for a registration key when the command has no options', async () => {
      const result = await processConnect({
        body: withData({ options: undefined })
      });

      expect(result).toEqual({
        content: 'Please provide a registration key. Usage: `/connect KEY`',
        flags: 64,
        success: false
      });
      expect(prismaMock.state.findFirst).not.toHaveBeenCalled();
    });

    it('asks for a registration key when no option is named key', async () => {
      const result = await processConnect({
        body: withData({ options: [{ name: 'token', value: 'state-1' }] })
      });

      expect(result).toEqual({
        content: 'Please provide a registration key. Usage: `/connect KEY`',
        flags: 64,
        success: false
      });
    });
  });

  describe('when resolving the registration key', () => {
    it('looks up the state by the key option including its integration and team', async () => {
      await processConnect({
        body: withData({
          options: [
            { name: 'other', value: 'ignored' },
            { name: 'key', value: 'state-xyz' }
          ]
        })
      });

      expect(prismaMock.state.findFirst).toHaveBeenCalledWith({
        where: { id: 'state-xyz' },
        include: { integration: { include: { team: true } } }
      });
    });

    it('points to the app setup page when the key does not exist', async () => {
      prismaMock.state.findFirst.mockResolvedValue(null);

      const result = await processConnect({ body: commandInteraction() });

      expect(result).toEqual({
        content: `No pending integration found for this server. Visit ${APP_URL}/app to start the setup process.`,
        flags: 64,
        success: false
      });
      expect(prismaMock.integration.update).not.toHaveBeenCalled();
    });

    it('returns the generic error when the key does not exist and the app url is not configured', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', undefined);
      prismaMock.state.findFirst.mockResolvedValue(null);

      const result = await processConnect({ body: commandInteraction() });

      expect(result).toEqual(GENERIC_ERROR);
    });

    it('asks to regenerate the key when the state has no integration', async () => {
      prismaMock.state.findFirst.mockResolvedValue(stateWith(null));

      const result = await processConnect({ body: commandInteraction() });

      expect(result).toEqual({
        content:
          'No integration found for this registration key. Please regenerate your registration key and try again.',
        flags: 64,
        success: false
      });
    });

    it('reports an invalid team when the integration has no team', async () => {
      prismaMock.state.findFirst.mockResolvedValue(
        stateWith({ id: 'integration-1', team: null })
      );

      const result = await processConnect({ body: commandInteraction() });

      expect(result).toEqual(INVALID_TEAM);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('reports an invalid team when the team has an empty slug', async () => {
      prismaMock.state.findFirst.mockResolvedValue(
        stateWith({ id: 'integration-1', team: { id: 'team-1', slug: '' } })
      );

      const result = await processConnect({ body: commandInteraction() });

      expect(result).toEqual(INVALID_TEAM);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('when the key resolves to a team', () => {
    it('fetches the guild information with the bot token', async () => {
      await processConnect({ body: commandInteraction() });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://discord.com/api/v10/guilds/guild-1',
        { headers: { Authorization: 'Bot bot-token' } }
      );
    });

    it('activates the integration with the guild id, guild name and interaction settings', async () => {
      const body = commandInteraction();

      await processConnect({ body });

      expect(prismaMock.integration.update).toHaveBeenCalledWith({
        where: { id: 'integration-1' },
        data: {
          account_id: 'guild-1',
          label: 'Doggo Server',
          status: 'ACTIVE',
          settings: {
            member: discordMember(),
            channel: discordChannel(),
            guild: discordGuild()
          }
        }
      });
    });

    it('fetches the guild named by the guild object rather than the top-level guild id', async () => {
      await processConnect({ body: splitGuildIds() });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://discord.com/api/v10/guilds/guild-object',
        expect.any(Object)
      );
    });

    it('stores the guild object id rather than the top-level guild id as the account id', async () => {
      await processConnect({ body: splitGuildIds() });

      expect(prismaMock.integration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ account_id: 'guild-object' })
        })
      );
    });

    it('returns a success embed linking to the team integrations page', async () => {
      const result = await processConnect({ body: commandInteraction() });

      expect(result).toEqual({
        embeds: [
          {
            title: 'Successfully Connected!',
            description: `Giveaway.dog is now connected to your team!\n\nYou can now update your settings any time.\n\n[Manage your integration here](${APP_URL}/app/acme/settings/integrations)`,
            color: 0x00ff00
          }
        ],
        flags: 64,
        success: true
      });
    });

    it('does not log an error on success', async () => {
      await processConnect({ body: commandInteraction() });

      expect(consoleError).not.toHaveBeenCalled();
    });
  });

  describe('when an unexpected failure occurs', () => {
    it('returns the generic error when the interaction settings fail validation, before calling discord', async () => {
      const channel = {
        ...discordChannel(),
        name: undefined
      } as unknown as ReturnType<typeof discordChannel>;

      const result = await processConnect({
        body: commandInteraction({ channel })
      });

      expect(result).toEqual(GENERIC_ERROR);
      expect(fetchMock).not.toHaveBeenCalled();
      expect(prismaMock.integration.update).not.toHaveBeenCalled();
    });

    it('returns the generic error when the guild lookup fails', async () => {
      fetchMock.mockResolvedValue(jsonResponse({}, { status: 403 }));

      const result = await processConnect({ body: commandInteraction() });

      expect(result).toEqual(GENERIC_ERROR);
      expect(prismaMock.integration.update).not.toHaveBeenCalled();
    });

    it('returns the generic error when the state lookup throws', async () => {
      prismaMock.state.findFirst.mockRejectedValue(new Error('db down'));

      const result = await processConnect({ body: commandInteraction() });

      expect(result).toEqual(GENERIC_ERROR);
    });

    it('returns the generic error and logs it when activating the integration fails', async () => {
      const error = new Error('update failed');
      prismaMock.integration.update.mockRejectedValue(error);

      const result = await processConnect({ body: commandInteraction() });

      expect(result).toEqual(GENERIC_ERROR);
      expect(consoleError).toHaveBeenCalledWith(
        'Error handling /connect command:',
        error
      );
    });
  });
});
