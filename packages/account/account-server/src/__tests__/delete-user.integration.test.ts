import { describe, expect, it, vi } from 'vitest';
import { db } from '@giveaway/testing-integration/database';
import {
  createHost,
  createSweepstakes,
  createUser
} from '@giveaway/testing-integration/fixtures';
import { signIn } from '@giveaway/testing-server/session';
import { expectOk } from '@giveaway/testing-server/result';
import deleteUser from '../delete-user';

vi.mock('@giveaway/auth-server/config', () => ({
  signOut: vi.fn(),
  signIn: vi.fn(),
  auth: vi.fn(),
  handlers: { GET: vi.fn(), POST: vi.fn() }
}));

vi.mock('@giveaway/auth-core/session-revocation', () => ({
  revokeUserSessions: vi.fn()
}));

const setup = async () => {
  const { user: owner, team } = await createHost();
  const admin = await createUser({ accountType: 'HOST' });
  await db.membership.create({
    data: { teamId: team.id, userId: admin.id, role: 'ADMIN' }
  });
  const sweepstakes = await createSweepstakes({ teamId: team.id });
  const template = await db.template.create({
    data: {
      name: 'Kept template',
      description: 'A template of the team',
      image: 'https://example.com/template.png',
      content: {},
      teamId: team.id,
      createdById: owner.id
    }
  });
  const integration = await db.integration.create({
    data: {
      provider: 'DISCORD',
      account_id: `guild-${team.id}`,
      teamId: team.id,
      ownerId: owner.id
    }
  });
  return { owner, team, sweepstakes, template, integration };
};

describe('deleteUser', () => {
  it("[ACCOUNT-027] keeps the giveaways, templates and integrations of the host's team", async () => {
    const { owner, team, sweepstakes, template, integration } = await setup();
    signIn({ id: owner.id });

    expectOk(await deleteUser());

    expect(await db.user.findUnique({ where: { id: owner.id } })).toBeNull();
    expect(
      await db.sweepstakes.findUnique({ where: { id: sweepstakes.id } })
    ).toMatchObject({ teamId: team.id });
    expect(
      await db.template.findUnique({ where: { id: template.id } })
    ).toMatchObject({ teamId: team.id, createdById: null });
    expect(
      await db.integration.findUnique({ where: { id: integration.id } })
    ).toMatchObject({ teamId: team.id, ownerId: null });
    expect(
      await db.membership.findMany({
        where: { teamId: team.id },
        select: { role: true }
      })
    ).toEqual([{ role: 'ADMIN' }]);
  });
});
