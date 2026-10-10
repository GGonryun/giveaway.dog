import { z } from 'zod';

export const E2E_FAKE_SERVICES = [
  'email',
  'scrapebadger',
  'geo',
  'discord',
  'x',
  'bluesky',
  'moderation'
] as const;

export type E2eFakeService = (typeof E2E_FAKE_SERVICES)[number];

export const E2E_FAKE_ALL = 'all';

export const parseE2eFakeServices = (
  value: string | null | undefined
): E2eFakeService[] => {
  if (!value) return [];
  const names = value.split(',').map((name) => name.trim().toLowerCase());
  if (names.includes(E2E_FAKE_ALL)) return [...E2E_FAKE_SERVICES];
  return E2E_FAKE_SERVICES.filter((service) => names.includes(service));
};

export const E2E_OUTBOX_TTL_SECONDS = 60 * 60;

export const E2E_OUTBOX_MAX_ENTRIES = 100;

export const E2E_OUTBOX_CHANNELS = [
  'email',
  'discord-alert',
  'discord',
  'x',
  'bluesky'
] as const;

export type E2eOutboxChannel = (typeof E2E_OUTBOX_CHANNELS)[number];

const E2E_OUTBOX_TARGET_PATTERN = /^[A-Za-z0-9@._+-]{1,200}$/;

export const e2eOutboxQuerySchema = z
  .object({
    channel: z.enum(E2E_OUTBOX_CHANNELS),
    target: z.string().regex(E2E_OUTBOX_TARGET_PATTERN)
  })
  .strict();

export type E2eOutboxQuery = z.infer<typeof e2eOutboxQuerySchema>;

export const toE2eOutboxKey = ({ channel, target }: E2eOutboxQuery) =>
  `e2e:outbox:${channel}:${target.toLowerCase()}`;

export type E2eOutboxEntry = {
  channel: E2eOutboxChannel;
  target: string;
  at: string;
  id: string;
  payload: Record<string, unknown>;
};

export const E2E_FAKE_ID_PREFIX = 'e2e-fake-';

export const E2E_X_FIXTURES = {
  tweet: '9000000000000000001',
  tweetWithoutViews: '9000000000000000002',
  tweetNotFound: '9000000000000000404',
  author: 'e2e_fixture_host',
  retweetersPerPage: 20,
  retweeters: 45
} as const;

export const toE2eXFixtureRetweeterUsername = (index: number) =>
  `e2e_fixture_rt${index}`;
