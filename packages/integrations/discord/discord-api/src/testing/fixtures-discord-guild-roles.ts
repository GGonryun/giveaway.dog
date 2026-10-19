const role = (overrides: Record<string, unknown>) => ({
  id: '1100000000000000001',
  name: '@everyone',
  description: null,
  permissions: '2248473465835073',
  position: 0,
  color: 0,
  colors: { primary_color: 0, secondary_color: null, tertiary_color: null },
  hoist: false,
  managed: false,
  mentionable: false,
  icon: null,
  unicode_emoji: null,
  flags: 0,
  ...overrides
});

export const discordGuildRolesFixture = [
  role({}),
  role({
    id: '1400000000000000001',
    name: 'Giveaway Winners',
    position: 2,
    color: 15844367,
    colors: {
      primary_color: 15844367,
      secondary_color: null,
      tertiary_color: null
    },
    hoist: true,
    mentionable: true
  }),
  role({
    id: '1400000000000000002',
    name: 'Members',
    position: 1,
    color: 3447003,
    colors: {
      primary_color: 3447003,
      secondary_color: null,
      tertiary_color: null
    },
    unicode_emoji: '🐶'
  }),
  role({
    id: '1400000000000000003',
    name: 'Giveaway Dog',
    permissions: '274877991936',
    position: 3,
    managed: true,
    tags: { bot_id: '1500000000000000001' }
  })
];
