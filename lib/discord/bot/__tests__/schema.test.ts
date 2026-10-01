import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import { ApplicationError } from '@/lib/errors';
import {
  discordApplicationCommandInteractionSchema,
  discordButtonInteractionSchema,
  discordChannelSchema,
  discordCommandOptionSchema,
  discordEmbedSchema,
  discordFollowupMessageSchema,
  discordGuildSchema,
  discordInteractionDataSchema,
  discordInteractionSchema,
  discordMemberSchema,
  discordPingInteractionSchema,
  discordUserSchema,
  toDiscordApplicationCommandInteraction,
  toDiscordInteraction
} from '../schema';
import {
  applicationCommandInteraction,
  buttonInteraction,
  discordChannel,
  discordGuild,
  discordMember,
  discordUser,
  pingInteraction
} from '../../__tests__/fixtures-discord-core';

const without = (value: object, ...keys: string[]) => {
  const copy: Record<string, unknown> = { ...value };
  for (const key of keys) {
    delete copy[key];
  }
  return copy;
};

const captureError = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('Expected function to throw');
};

describe('discordUserSchema', () => {
  it('accepts a minimal user', () => {
    expect(discordUserSchema.parse(discordUser())).toEqual(discordUser());
  });

  it('accepts null values for the nullish profile fields', () => {
    const input = discordUser({
      avatar: null,
      avatar_decoration_data: null,
      clan: null,
      collectibles: null,
      display_name_styles: null,
      global_name: null,
      primary_guild: null
    });

    expect(discordUserSchema.parse(input)).toEqual(input);
  });

  it('accepts arbitrary values for the loosely typed fields', () => {
    const input = discordUser({
      avatar_decoration_data: { asset: 'a', sku_id: '1' },
      clan: { tag: 'DOG' },
      collectibles: [1, 2],
      display_name_styles: 'fancy',
      primary_guild: 42,
      bot: true,
      system: false
    });

    expect(discordUserSchema.parse(input)).toEqual(input);
  });

  it.each(['discriminator', 'id', 'public_flags', 'username'])(
    'requires %s',
    (key) => {
      expect(
        discordUserSchema.safeParse(without(discordUser(), key)).success
      ).toBe(false);
    }
  );

  it('rejects a null bot flag because it is only optional', () => {
    expect(
      discordUserSchema.safeParse({ ...discordUser(), bot: null }).success
    ).toBe(false);
  });

  it('strips unknown keys', () => {
    expect(
      discordUserSchema.parse({ ...discordUser(), locale: 'en-US' })
    ).not.toHaveProperty('locale');
  });
});

describe('discordChannelSchema', () => {
  it('accepts a channel with nullish optional fields', () => {
    const input = discordChannel({
      last_message_id: null,
      parent_id: null,
      topic: null
    });

    expect(discordChannelSchema.parse(input)).toEqual(input);
  });

  it('accepts a channel with all optional fields populated', () => {
    const input = discordChannel({
      last_message_id: 'm-1',
      parent_id: 'cat-1',
      topic: 'Chat here'
    });

    expect(discordChannelSchema.parse(input)).toEqual(input);
  });

  it.each([
    'flags',
    'guild_id',
    'id',
    'name',
    'nsfw',
    'permissions',
    'position',
    'rate_limit_per_user',
    'type'
  ])('requires %s', (key) => {
    expect(
      discordChannelSchema.safeParse(without(discordChannel(), key)).success
    ).toBe(false);
  });
});

describe('discordGuildSchema', () => {
  it('accepts a guild', () => {
    expect(discordGuildSchema.parse(discordGuild())).toEqual(discordGuild());
  });

  it('accepts an empty feature list', () => {
    expect(discordGuildSchema.parse(discordGuild({ features: [] }))).toEqual(
      discordGuild({ features: [] })
    );
  });

  it('rejects non-string features', () => {
    expect(
      discordGuildSchema.safeParse({ ...discordGuild(), features: [1] }).success
    ).toBe(false);
  });

  it('requires a locale', () => {
    expect(
      discordGuildSchema.safeParse(without(discordGuild(), 'locale')).success
    ).toBe(false);
  });
});

describe('discordMemberSchema', () => {
  it('accepts a member', () => {
    expect(discordMemberSchema.parse(discordMember())).toEqual(discordMember());
  });

  it('accepts populated nullish fields', () => {
    const input = discordMember({
      avatar: 'a',
      banner: 'b',
      collectibles: { x: 1 },
      communication_disabled_until: '2025-01-01T00:00:00.000Z',
      display_name_styles: null,
      nick: 'Rex',
      premium_since: null,
      unusual_dm_activity_until: null
    });

    expect(discordMemberSchema.parse(input)).toEqual(input);
  });

  it('rejects a member with an invalid nested user', () => {
    expect(
      discordMemberSchema.safeParse({
        ...discordMember(),
        user: without(discordUser(), 'id')
      }).success
    ).toBe(false);
  });

  it('rejects non-string roles', () => {
    expect(
      discordMemberSchema.safeParse({ ...discordMember(), roles: [123] })
        .success
    ).toBe(false);
  });

  it.each(['deaf', 'flags', 'joined_at', 'mute', 'pending', 'permissions'])(
    'requires %s',
    (key) => {
      expect(
        discordMemberSchema.safeParse(without(discordMember(), key)).success
      ).toBe(false);
    }
  );
});

describe('discordCommandOptionSchema', () => {
  it('accepts a string option', () => {
    expect(
      discordCommandOptionSchema.parse({ name: 'code', value: 'abc' })
    ).toEqual({ name: 'code', value: 'abc' });
  });

  it('rejects a numeric option value', () => {
    expect(
      discordCommandOptionSchema.safeParse({ name: 'count', value: 3 }).success
    ).toBe(false);
  });
});

describe('discordInteractionDataSchema', () => {
  it('accepts command data without options or guild', () => {
    const input = { id: 'cmd-1', name: 'connect', type: 1 };

    expect(discordInteractionDataSchema.parse(input)).toEqual(input);
  });

  it('accepts command data with options and guild', () => {
    const input = {
      id: 'cmd-1',
      name: 'connect',
      type: 1,
      guild_id: 'guild-1',
      options: [{ name: 'code', value: 'xyz' }]
    };

    expect(discordInteractionDataSchema.parse(input)).toEqual(input);
  });

  it('rejects invalid options', () => {
    expect(
      discordInteractionDataSchema.safeParse({
        id: 'cmd-1',
        name: 'connect',
        type: 1,
        options: [{ name: 'code' }]
      }).success
    ).toBe(false);
  });
});

describe('discordPingInteractionSchema', () => {
  it('accepts a ping interaction', () => {
    expect(discordPingInteractionSchema.parse(pingInteraction())).toEqual(
      pingInteraction()
    );
  });

  it('accepts optional entitlement sku ids', () => {
    const input = { ...pingInteraction(), entitlement_sku_ids: ['sku-1'] };

    expect(discordPingInteractionSchema.parse(input)).toEqual(input);
  });

  it('requires a user', () => {
    expect(
      discordPingInteractionSchema.safeParse(without(pingInteraction(), 'user'))
        .success
    ).toBe(false);
  });

  it('rejects any other type', () => {
    expect(
      discordPingInteractionSchema.safeParse({ ...pingInteraction(), type: 2 })
        .success
    ).toBe(false);
  });

  it('rejects non-string integration owner values', () => {
    expect(
      discordPingInteractionSchema.safeParse({
        ...pingInteraction(),
        authorizing_integration_owners: { '0': 1 }
      }).success
    ).toBe(false);
  });

  it.each([
    'app_permissions',
    'application_id',
    'attachment_size_limit',
    'authorizing_integration_owners',
    'entitlements',
    'id',
    'token',
    'version'
  ])('requires the base field %s', (key) => {
    expect(
      discordPingInteractionSchema.safeParse(without(pingInteraction(), key))
        .success
    ).toBe(false);
  });
});

describe('discordApplicationCommandInteractionSchema', () => {
  it('accepts a guild command interaction', () => {
    expect(
      discordApplicationCommandInteractionSchema.parse(
        applicationCommandInteraction()
      )
    ).toEqual(applicationCommandInteraction());
  });

  it('accepts a direct message command without guild, member or channel', () => {
    const input = {
      ...without(
        applicationCommandInteraction(),
        'guild',
        'member',
        'channel',
        'guild_id'
      ),
      user: discordUser(),
      context: 1,
      guild_locale: 'en-GB'
    };

    expect(discordApplicationCommandInteractionSchema.parse(input)).toEqual(
      input
    );
  });

  it.each(['data', 'locale'])('requires %s', (key) => {
    expect(
      discordApplicationCommandInteractionSchema.safeParse(
        without(applicationCommandInteraction(), key)
      ).success
    ).toBe(false);
  });
});

describe('discordButtonInteractionSchema', () => {
  it('accepts a button interaction', () => {
    expect(discordButtonInteractionSchema.parse(buttonInteraction())).toEqual(
      buttonInteraction()
    );
  });

  it('requires the source message', () => {
    expect(
      discordButtonInteractionSchema.safeParse(
        without(buttonInteraction(), 'message')
      ).success
    ).toBe(false);
  });

  it('requires a custom id and component type', () => {
    expect(
      discordButtonInteractionSchema.safeParse({
        ...buttonInteraction(),
        data: { custom_id: 'task:enter:1' }
      }).success
    ).toBe(false);
  });
});

describe('discordInteractionSchema', () => {
  it.each([
    ['ping', pingInteraction()],
    ['application command', applicationCommandInteraction()],
    ['button', buttonInteraction()]
  ])('accepts a %s interaction', (_name, input) => {
    expect(discordInteractionSchema.parse(input)).toEqual(input);
  });

  it('rejects an unsupported interaction type', () => {
    const result = discordInteractionSchema.safeParse({
      ...pingInteraction(),
      type: 4
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].code).toBe('invalid_union_discriminator');
  });

  it('validates against the schema of the matching type', () => {
    expect(
      discordInteractionSchema.safeParse({ ...pingInteraction(), type: 3 })
        .success
    ).toBe(false);
  });
});

describe('discordEmbedSchema', () => {
  it('accepts an empty embed', () => {
    expect(discordEmbedSchema.parse({})).toEqual({});
  });

  it('accepts a full embed with footer', () => {
    const input = {
      title: 'Title',
      description: 'Body',
      color: 123,
      footer: { text: 'Footer', icon_url: 'https://example.com/i.png' }
    };

    expect(discordEmbedSchema.parse(input)).toEqual(input);
  });

  it('accepts an empty footer', () => {
    expect(discordEmbedSchema.parse({ footer: {} })).toEqual({ footer: {} });
  });

  it('rejects a string color', () => {
    expect(discordEmbedSchema.safeParse({ color: 'blue' }).success).toBe(false);
  });
});

describe('discordFollowupMessageSchema', () => {
  it('accepts an empty message', () => {
    expect(discordFollowupMessageSchema.parse({})).toEqual({});
  });

  it('accepts content, embeds and flags', () => {
    const input = { content: 'Hi', embeds: [{ title: 'T' }], flags: 64 };

    expect(discordFollowupMessageSchema.parse(input)).toEqual(input);
  });

  it('rejects invalid embeds', () => {
    expect(
      discordFollowupMessageSchema.safeParse({ embeds: [{ title: 1 }] }).success
    ).toBe(false);
  });
});

describe('toDiscordInteraction', () => {
  it('returns the parsed interaction without unknown keys', () => {
    const result = toDiscordInteraction({
      ...buttonInteraction(),
      guild_locale: 'en-US'
    });

    expect(result).toEqual(buttonInteraction());
  });

  it('throws VALIDATION_ERROR with the zod error as cause for invalid data', () => {
    const error = captureError(() => toDiscordInteraction({ type: 1 }));

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Invalid Discord interaction data'
    });
    expect((error as ApplicationError).cause).toBeInstanceOf(ZodError);
  });

  it('throws VALIDATION_ERROR for null input', () => {
    expect(captureError(() => toDiscordInteraction(null))).toMatchObject({
      code: 'VALIDATION_ERROR'
    });
  });
});

describe('toDiscordApplicationCommandInteraction', () => {
  it('returns the parsed application command interaction', () => {
    expect(
      toDiscordApplicationCommandInteraction(applicationCommandInteraction())
    ).toEqual(applicationCommandInteraction());
  });

  it('rejects other interaction types with VALIDATION_ERROR', () => {
    const error = captureError(() =>
      toDiscordApplicationCommandInteraction(buttonInteraction())
    );

    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Invalid Discord application command interaction data'
    });
    expect((error as ApplicationError).cause).toBeInstanceOf(ZodError);
  });
});
