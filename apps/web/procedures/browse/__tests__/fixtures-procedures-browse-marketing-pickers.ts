import type {
  SweepstakesStatus,
  UserAccountType,
  UserSource,
  VisibilityType
} from '@prisma/client';

export const FIXED_NOW = new Date('2026-06-15T12:00:00.000Z');

export const DAY_MS = 24 * 60 * 60 * 1000;

export const daysFromFixedNow = (days: number) =>
  new Date(FIXED_NOW.getTime() + days * DAY_MS);

export type PublicSweepstakesFixtureOptions = {
  id?: string;
  status?: SweepstakesStatus;
  createdAt?: Date;
  name?: string | null;
  description?: string | null;
  banner?: string | null;
  slug?: string | null;
  visibility?: VisibilityType;
  startDate?: Date | null;
  endDate?: Date | null;
  team?: { id: string; slug: string; name: string } | null;
  prizeCount?: number;
  participantIds?: string[];
};

export const buildPublicSweepstakes = ({
  id = 'sw-1',
  status = 'ACTIVE',
  createdAt = daysFromFixedNow(-10),
  name = 'Great Giveaway',
  description = 'Win something nice',
  banner = null,
  slug = null,
  visibility = 'PUBLIC',
  startDate = daysFromFixedNow(-2),
  endDate = daysFromFixedNow(5),
  team = { id: 'team-1', slug: 'acme', name: 'Acme' },
  prizeCount = 1,
  participantIds = []
}: PublicSweepstakesFixtureOptions = {}) => ({
  id,
  status,
  teamId: team?.id ?? null,
  createdAt,
  updatedAt: createdAt,
  details: {
    id: `${id}-details`,
    sweepstakesId: id,
    name,
    description,
    banner
  },
  timing: {
    id: `${id}-timing`,
    sweepstakesId: id,
    startDate,
    endDate,
    timeZone: 'UTC'
  },
  team: team
    ? {
        ...team,
        logo: 'https://example.com/logo.png',
        links: null,
        createdAt,
        updatedAt: createdAt,
        tier: 'FREE'
      }
    : null,
  visibility: {
    id: `${id}-visibility`,
    sweepstakesId: id,
    visibility,
    slug,
    createdAt,
    updatedAt: createdAt
  },
  prizes: Array.from({ length: prizeCount }, (_, index) => ({
    id: `${id}-prize-${index}`,
    sweepstakesId: id,
    name: `Prize ${index}`,
    index,
    quota: 1,
    draws: []
  })),
  tasks: [
    {
      id: `${id}-task-1`,
      sweepstakesId: id,
      index: 0,
      config: null,
      completions: participantIds.map((participantId, index) => ({
        id: `${id}-completion-${index}`,
        participantId,
        taskId: `${id}-task-1`
      }))
    }
  ],
  audience: null,
  terms: null,
  _count: { participants: participantIds.length }
});

export type SelectedUserOptions = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  source?: UserSource;
  accountType?: UserAccountType;
  birthday?: Date | null;
};

export const buildSelectedUser = ({
  id = 'user-1',
  name = 'Test User',
  email = 'test@example.com',
  image = 'https://example.com/avatar.png',
  source = 'SIGNUP',
  accountType = 'PARTICIPANT',
  birthday = null
}: SelectedUserOptions = {}) => ({
  id,
  email,
  name,
  image,
  source,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  birthday,
  agents: [],
  ips: [],
  quality: [],
  emailVerified: null,
  accounts: [],
  onboarded: true,
  accountType,
  username: null,
  preferredContactMethod: null
});
