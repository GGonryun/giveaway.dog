import 'server-only';

import { IntegrationProvider, Prisma, PrismaClient } from '@giveaway/db-model';
import { E2eIntegrationsRequest } from '@giveaway/e2e-model/extras';
import {
  BLUESKY_SCOPE_GROUPS,
  TWITCH_SCOPE_GROUPS,
  TWITTER_SCOPE_GROUPS
} from '@giveaway/integration-model/scopes';
import { findE2eTeam, findE2eTeamOwner } from './ownership';

const unique = (groups: Record<string, string[]>) => [
  ...new Set(Object.values(groups).flat())
];

export const E2E_INTEGRATION_SCOPES: Record<IntegrationProvider, string[]> = {
  TWITTER: unique(TWITTER_SCOPE_GROUPS),
  BLUESKY: unique(BLUESKY_SCOPE_GROUPS),
  TWITCH: unique(TWITCH_SCOPE_GROUPS),
  DISCORD: []
};

const toLogin = (slug: string) => slug.replace(/-/g, '_');

export const toE2eIntegrationSettings = (
  provider: IntegrationProvider,
  slug: string
): Prisma.InputJsonObject => {
  if (provider !== IntegrationProvider.TWITCH) return {};
  const login = toLogin(slug);
  return {
    broadcasterId: slug,
    broadcasterLogin: login,
    broadcasterDisplayName: login,
    channelUrl: `https://www.twitch.tv/${login}`
  };
};

export const seedE2eIntegrations = async ({
  db,
  request
}: {
  db: PrismaClient;
  request: E2eIntegrationsRequest;
}) => {
  const team = await findE2eTeam(db, request.team);
  const owner = findE2eTeamOwner(team);
  const rows = request.integrations.map((integration) => ({
    provider: integration.provider,
    teamId: team.id,
    ownerId: owner.id,
    account_id: `${team.slug}-${integration.provider.toLowerCase()}`,
    status: integration.status,
    label: integration.label ?? toLogin(team.slug),
    scope: (
      integration.scopes ?? E2E_INTEGRATION_SCOPES[integration.provider]
    ).join(' '),
    token_type: 'bearer',
    settings: (integration.settings ??
      toE2eIntegrationSettings(
        integration.provider,
        team.slug
      )) as Prisma.InputJsonObject
  }));

  await db.$transaction([
    db.integration.deleteMany({
      where: {
        teamId: team.id,
        provider: { in: rows.map((row) => row.provider) }
      }
    }),
    db.integration.createMany({ data: rows })
  ]);

  const integrations = await db.integration.findMany({
    where: {
      teamId: team.id,
      provider: { in: rows.map((row) => row.provider) }
    },
    select: {
      id: true,
      provider: true,
      account_id: true,
      status: true,
      label: true,
      scope: true,
      settings: true
    },
    orderBy: { provider: 'asc' }
  });

  return { team: team.slug, integrations };
};
