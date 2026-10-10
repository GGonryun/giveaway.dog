import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { db } from '@giveaway/testing-integration/database';
import {
  createEntry,
  createSweepstakes,
  createUser
} from '@giveaway/testing-integration/fixtures';

const readSql = (name: string) =>
  readFileSync(new URL(`../production/${name}`, import.meta.url), 'utf8');

const LIST = readSql('list-e2e-data.sql');
const DELETE = readSql('delete-e2e-data.sql');

type Row = {
  kind: string;
  name: string;
  giveaways: bigint | null;
  entries: bigint | null;
  action: string;
};

const list = async () =>
  (await db.$queryRawUnsafe<Row[]>(LIST)).map((row) => ({
    kind: row.kind,
    name: row.name,
    giveaways: row.giveaways === null ? null : Number(row.giveaways),
    entries: row.entries === null ? null : Number(row.entries),
    action: row.action
  }));

const statementsOf = (sql: string) =>
  sql
    .split(/;\s*\n/)
    .map((statement) => statement.trim())
    .filter((statement) => statement && !/^(BEGIN|COMMIT)$/.test(statement));

const deleteE2eData = () =>
  db.$transaction(async (tx) => {
    for (const statement of statementsOf(DELETE)) {
      await tx.$executeRawUnsafe(statement);
    }
  });

const createTeam = (slug: string, members: { id: string }[]) =>
  db.team.create({
    data: {
      name: slug,
      slug,
      members: {
        create: members.map((user, index) => ({
          userId: user.id,
          role: index === 0 ? 'OWNER' : 'MEMBER'
        }))
      }
    }
  });

const seed = async () => {
  const sharedHost = await createUser({ email: 'e2e-host@example.com' });
  const persona = await createUser({ email: 'e2e-admin-abc123@example.com' });
  const mixedPersona = await createUser({
    email: 'e2e-member-abc123@example.com'
  });
  const realUser = await createUser({ email: 'real@example.com' });
  const lookalike = await createUser({ email: 'e2e-host@example.org' });

  const e2eTeam = await createTeam('e2e-abc123-w0', [sharedHost, persona]);
  const unnamedE2eTeam = await createTeam('host-team', [sharedHost]);
  const mixedTeam = await createTeam('e2e-abc123-w1', [realUser, mixedPersona]);
  const realTeam = await createTeam('real-team', [realUser, mixedPersona]);

  const e2eGiveaway = await createSweepstakes({ teamId: e2eTeam.id });
  const realGiveaway = await createSweepstakes({ teamId: realTeam.id });
  await createEntry({
    sweepstakesId: realGiveaway.id,
    taskIds: [realGiveaway.tasks[0].id],
    userId: persona.id
  });
  await createEntry({
    sweepstakesId: realGiveaway.id,
    taskIds: [realGiveaway.tasks[0].id],
    userId: realUser.id
  });

  const picker = await db.twitterPicker.create({
    data: { teamId: e2eTeam.id, winners: 1 }
  });
  const pickerUser = await db.twitterPickerUser.create({
    data: { pickerId: picker.id, userId: 'x-user' }
  });
  await db.twitterPickerDraw.create({
    data: { pickerId: picker.id, userId: pickerUser.id }
  });

  return {
    sharedHost,
    persona,
    mixedPersona,
    realUser,
    lookalike,
    e2eTeam,
    unnamedE2eTeam,
    mixedTeam,
    realTeam,
    e2eGiveaway,
    realGiveaway
  };
};

describe('production e2e data scripts', () => {
  it('lists the e2e teams and users, and what happens to each', async () => {
    await seed();

    expect(await list()).toEqual([
      {
        kind: 'team',
        name: 'e2e-abc123-w0',
        giveaways: 1,
        entries: null,
        action: 'delete'
      },
      {
        kind: 'team',
        name: 'host-team',
        giveaways: 0,
        entries: null,
        action: 'delete'
      },
      {
        kind: 'team kept',
        name: 'e2e-abc123-w1',
        giveaways: 0,
        entries: null,
        action: 'keep: has a member who is not e2e'
      },
      {
        kind: 'user',
        name: 'e2e-host@example.com',
        giveaways: null,
        entries: 0,
        action: 'delete'
      },
      {
        kind: 'user',
        name: 'e2e-admin-abc123@example.com',
        giveaways: null,
        entries: 1,
        action: 'delete'
      },
      {
        kind: 'user',
        name: 'e2e-member-abc123@example.com',
        giveaways: null,
        entries: 0,
        action: 'keep: member of a team that is not e2e'
      }
    ]);
  });

  it('deletes only the rows that the list marks for deletion', async () => {
    const rows = await seed();

    await deleteE2eData();

    const users = await db.user.findMany({ select: { email: true } });
    expect(users.map((user) => user.email).sort()).toEqual([
      'e2e-host@example.org',
      'e2e-member-abc123@example.com',
      'real@example.com'
    ]);
    const teams = await db.team.findMany({ select: { slug: true } });
    expect(teams.map((team) => team.slug).sort()).toEqual([
      'e2e-abc123-w1',
      'real-team'
    ]);
    expect(await db.sweepstakes.findMany({ select: { id: true } })).toEqual([
      { id: rows.realGiveaway.id }
    ]);
    expect(
      await db.sweepstakesParticipant.findMany({ select: { userId: true } })
    ).toEqual([{ userId: rows.realUser.id }]);
    expect(await db.twitterPicker.count()).toBe(0);
    expect(await db.twitterPickerDraw.count()).toBe(0);
    expect(
      await db.membership.count({ where: { teamId: rows.realTeam.id } })
    ).toBe(2);
    expect(await list()).toEqual([
      {
        kind: 'team kept',
        name: 'e2e-abc123-w1',
        giveaways: 0,
        entries: null,
        action: 'keep: has a member who is not e2e'
      },
      {
        kind: 'user',
        name: 'e2e-member-abc123@example.com',
        giveaways: null,
        entries: 0,
        action: 'keep: member of a team that is not e2e'
      }
    ]);
  });

  it('deletes nothing when there is no e2e data', async () => {
    const realUser = await createUser({ email: 'real@example.com' });
    await createTeam('real-team', [realUser]);

    await deleteE2eData();

    expect(await db.user.count()).toBe(1);
    expect(await db.team.count()).toBe(1);
    expect(await list()).toEqual([]);
  });
});
