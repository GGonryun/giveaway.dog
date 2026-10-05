import { describe, it, expect } from 'vitest';
import {
  discordBotTokenSchema,
  discordChannelSchema,
  discordGuildChannelsSchema,
  discordGuildInfoSchema,
  discordGuildRolesSchema,
  discordMessageResponseSchema,
  discordRoleSchema
} from '../schemas';

const guildInfo = {
  id: 'guild-1',
  name: 'Dog Park',
  icon: 'icon-hash',
  owner_id: 'owner-1'
};

const role = {
  id: 'role-1',
  name: 'Members',
  color: 0,
  hoist: false,
  icon: 'role-icon',
  unicode_emoji: '🐶',
  position: 1,
  permissions: '8',
  managed: false,
  mentionable: true
};

const channel = {
  id: 'channel-1',
  name: 'general',
  type: 0,
  position: 0,
  parent_id: 'category-1'
};

describe('discordGuildInfoSchema', () => {
  it('accepts a complete guild', () => {
    expect(discordGuildInfoSchema.parse(guildInfo)).toEqual(guildInfo);
  });

  it('accepts a null icon', () => {
    expect(discordGuildInfoSchema.parse({ ...guildInfo, icon: null })).toEqual({
      ...guildInfo,
      icon: null
    });
  });

  it('rejects an undefined icon', () => {
    expect(
      discordGuildInfoSchema.safeParse({ ...guildInfo, icon: undefined })
        .success
    ).toBe(false);
  });

  it.each(['id', 'name', 'owner_id'])('requires %s', (key) => {
    const input: Record<string, unknown> = { ...guildInfo };
    delete input[key];

    expect(discordGuildInfoSchema.safeParse(input).success).toBe(false);
  });

  it('strips unknown keys', () => {
    expect(
      discordGuildInfoSchema.parse({ ...guildInfo, features: ['COMMUNITY'] })
    ).toEqual(guildInfo);
  });
});

describe('discordRoleSchema', () => {
  it('accepts a complete role', () => {
    expect(discordRoleSchema.parse(role)).toEqual(role);
  });

  it('accepts null icon and emoji', () => {
    const input = { ...role, icon: null, unicode_emoji: null };

    expect(discordRoleSchema.parse(input)).toEqual(input);
  });

  it('accepts missing icon and emoji', () => {
    const input: Record<string, unknown> = { ...role };
    delete input.icon;
    delete input.unicode_emoji;

    expect(discordRoleSchema.parse(input)).toEqual(input);
  });

  it.each([
    ['color', '0'],
    ['hoist', 'false'],
    ['position', '1'],
    ['permissions', 8],
    ['managed', 0],
    ['mentionable', null]
  ])('rejects an invalid %s', (key, value) => {
    expect(discordRoleSchema.safeParse({ ...role, [key]: value }).success).toBe(
      false
    );
  });

  it.each([
    'id',
    'name',
    'color',
    'hoist',
    'position',
    'permissions',
    'managed',
    'mentionable'
  ])('requires %s', (key) => {
    const input: Record<string, unknown> = { ...role };
    delete input[key];

    expect(discordRoleSchema.safeParse(input).success).toBe(false);
  });
});

describe('discordGuildRolesSchema', () => {
  it('accepts an empty array', () => {
    expect(discordGuildRolesSchema.parse([])).toEqual([]);
  });

  it('rejects the array when any role is invalid', () => {
    expect(
      discordGuildRolesSchema.safeParse([role, { ...role, id: 1 }]).success
    ).toBe(false);
  });
});

describe('discordChannelSchema', () => {
  it('accepts a channel with a parent', () => {
    expect(discordChannelSchema.parse(channel)).toEqual(channel);
  });

  it('accepts a null parent id', () => {
    expect(
      discordChannelSchema.parse({ ...channel, parent_id: null }).parent_id
    ).toBeNull();
  });

  it('accepts a missing parent id', () => {
    const input: Record<string, unknown> = { ...channel };
    delete input.parent_id;

    expect(discordChannelSchema.parse(input)).toEqual(input);
  });

  it('rejects a string channel type', () => {
    expect(
      discordChannelSchema.safeParse({ ...channel, type: '0' }).success
    ).toBe(false);
  });

  it.each(['id', 'name', 'type', 'position'])('requires %s', (key) => {
    const input: Record<string, unknown> = { ...channel };
    delete input[key];

    expect(discordChannelSchema.safeParse(input).success).toBe(false);
  });

  it('strips unknown keys', () => {
    expect(
      discordChannelSchema.parse({ ...channel, topic: 'Chat', nsfw: false })
    ).toEqual(channel);
  });
});

describe('discordGuildChannelsSchema', () => {
  it('parses every channel in the array', () => {
    expect(
      discordGuildChannelsSchema.parse([channel, { ...channel, id: 'c-2' }])
    ).toHaveLength(2);
  });

  it('rejects a non-array value', () => {
    expect(discordGuildChannelsSchema.safeParse(channel).success).toBe(false);
  });
});

describe('discordMessageResponseSchema', () => {
  it('accepts a response with a guild id', () => {
    const input = { id: 'm-1', channel_id: 'c-1', guild_id: 'g-1' };

    expect(discordMessageResponseSchema.parse(input)).toEqual(input);
  });

  it('accepts a response without a guild id', () => {
    expect(
      discordMessageResponseSchema.parse({ id: 'm-1', channel_id: 'c-1' })
    ).toEqual({ id: 'm-1', channel_id: 'c-1' });
  });

  it('rejects a null guild id', () => {
    expect(
      discordMessageResponseSchema.safeParse({
        id: 'm-1',
        channel_id: 'c-1',
        guild_id: null
      }).success
    ).toBe(false);
  });

  it('rejects a response without a channel id', () => {
    expect(discordMessageResponseSchema.safeParse({ id: 'm-1' }).success).toBe(
      false
    );
  });

  it('rejects a response without a message id', () => {
    expect(
      discordMessageResponseSchema.safeParse({ channel_id: 'c-1' }).success
    ).toBe(false);
  });
});

describe('discordBotTokenSchema', () => {
  it('accepts a non-empty token', () => {
    expect(discordBotTokenSchema.parse('abc')).toBe('abc');
  });

  it('rejects an empty token with a required message', () => {
    const result = discordBotTokenSchema.safeParse('');

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      'Discord bot token is required'
    );
  });

  it('rejects a non-string token', () => {
    expect(discordBotTokenSchema.safeParse(123).success).toBe(false);
  });
});
