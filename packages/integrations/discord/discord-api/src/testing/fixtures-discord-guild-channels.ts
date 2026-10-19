const channel = (overrides: Record<string, unknown>) => ({
  id: '1300000000000000001',
  type: 0,
  guild_id: '1100000000000000001',
  position: 0,
  flags: 0,
  name: 'general',
  parent_id: '1300000000000000010',
  topic: null,
  last_message_id: '1600000000000000001',
  rate_limit_per_user: 0,
  nsfw: false,
  permission_overwrites: [],
  ...overrides
});

export const discordGuildChannelsFixture = [
  channel({
    id: '1300000000000000010',
    type: 4,
    name: 'Text Channels',
    parent_id: null,
    last_message_id: undefined,
    topic: undefined,
    rate_limit_per_user: undefined
  }),
  channel({}),
  channel({
    id: '1300000000000000002',
    name: 'announcements',
    type: 5,
    position: 1
  }),
  channel({
    id: '1300000000000000004',
    name: 'giveaways',
    position: 2,
    topic: 'Enter the giveaways here'
  }),
  channel({
    id: '1300000000000000005',
    type: 2,
    name: 'Voice',
    position: 3,
    bitrate: 64000,
    user_limit: 0,
    rtc_region: null
  })
];
