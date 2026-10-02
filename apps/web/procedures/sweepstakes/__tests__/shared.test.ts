import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SweepstakesJobStatus,
  SweepstakesJobType,
  SweepstakesStatus,
  SweepstakesTermsType,
  TeamRole,
  TeamTier,
  VisibilityType
} from '@prisma/client';
import {
  applySweepstakesChanges,
  findUserSweepstakes,
  findUserSweepstakesQuery,
  sanitizeSweepstakesInput
} from '../shared';
import { TeamPermission } from '@/lib/permissions';
import { TEAM_SWEEPSTAKES_PAYLOAD } from '@/schemas/giveaway/db';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { TEST_USER } from '@giveaway/testing-server/session';
import {
  SWEEPSTAKES_ID,
  TEAM_ID,
  buildMembership,
  buildTeam,
  buildTeamSweepstakes,
  stubSweepstakesRewrite
} from './fixtures-procedures-sweepstakes-b';

const NOW = new Date('2025-06-15T12:00:00.000Z');
const START = new Date('2025-06-20T00:00:00.000Z');
const END = new Date('2025-06-30T00:00:00.000Z');

const db = asPrismaClient();

describe('findUserSweepstakesQuery', () => {
  it('scopes the sweepstakes id to teams the user belongs to', () => {
    expect(
      findUserSweepstakesQuery({ id: 'sweep-9', userId: 'user-9' })
    ).toEqual({
      id: 'sweep-9',
      team: { members: { some: { userId: 'user-9' } } }
    });
  });
});

describe('findUserSweepstakes', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const find = (
    permission: TeamPermission = TeamPermission.UPDATE_SWEEPSTAKES,
    tier: TeamTier = TeamTier.FREE
  ) =>
    findUserSweepstakes({
      db,
      user: TEST_USER,
      id: SWEEPSTAKES_ID,
      permission,
      tier
    });

  it('queries the sweepstakes scoped to the user with the team payload', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue(buildTeamSweepstakes());

    await find();

    expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
      where: {
        id: SWEEPSTAKES_ID,
        team: { members: { some: { userId: TEST_USER.id } } }
      },
      include: TEAM_SWEEPSTAKES_PAYLOAD
    });
  });

  it('returns the sweepstakes, team and membership of the caller', async () => {
    const sweepstakes = buildTeamSweepstakes({
      team: buildTeam({
        members: [
          buildMembership({ userId: 'user-2', role: TeamRole.OWNER }),
          buildMembership({ role: TeamRole.MEMBER })
        ]
      })
    });
    prismaMock.sweepstakes.findUnique.mockResolvedValue(sweepstakes);

    const result = await find();

    expect(result).toEqual({
      sweepstakes,
      team: sweepstakes.team,
      membership: buildMembership({ role: TeamRole.MEMBER })
    });
  });

  it('throws NOT_FOUND when the sweepstakes does not exist', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

    await expect(find()).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Sweepstakes not found'
    });
  });

  it('logs the missing sweepstakes and user ids', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

    await expect(find()).rejects.toThrow();

    expect(consoleError).toHaveBeenCalledWith(
      `Sweepstakes with ID ${SWEEPSTAKES_ID} not found for user ${TEST_USER.id}`
    );
  });

  it('throws NOT_FOUND when the sweepstakes has no team', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue(
      buildTeamSweepstakes({ team: null, teamId: null })
    );

    await expect(find()).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Sweepstakes not found'
    });
  });

  it('throws FORBIDDEN when the caller is not a member of the team', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue(
      buildTeamSweepstakes({
        team: buildTeam({ members: [buildMembership({ userId: 'user-2' })] })
      })
    );

    await expect(find()).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'You are not a member of this team'
    });
  });

  it('throws FORBIDDEN when the caller role lacks the permission', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue(
      buildTeamSweepstakes({
        team: buildTeam({
          members: [buildMembership({ role: TeamRole.GUEST })]
        })
      })
    );

    await expect(find(TeamPermission.UPDATE_SWEEPSTAKES)).rejects.toMatchObject(
      {
        code: 'FORBIDDEN',
        message:
          'You do not have permission to perform this action. Required permission: UPDATE_SWEEPSTAKES'
      }
    );
  });

  it('allows a guest when only the view permission is required', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue(
      buildTeamSweepstakes({
        team: buildTeam({
          members: [buildMembership({ role: TeamRole.GUEST })]
        })
      })
    );

    const result = await find(TeamPermission.VIEW_SWEEPSTAKES);

    expect(result.membership.role).toBe(TeamRole.GUEST);
  });

  it('throws FORBIDDEN when the team tier is below the required tier', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue(buildTeamSweepstakes());

    await expect(
      find(TeamPermission.UPDATE_SWEEPSTAKES, TeamTier.PRO)
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: 'This feature requires a team with at least the PRO tier.'
    });
  });

  it('accepts a team whose tier is above the required tier', async () => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue(
      buildTeamSweepstakes({ team: buildTeam({ tier: TeamTier.ELITE }) })
    );

    const result = await find(TeamPermission.UPDATE_SWEEPSTAKES, TeamTier.PRO);

    expect(result.team.tier).toBe(TeamTier.ELITE);
  });
});

describe('sanitizeSweepstakesInput', () => {
  const UNSAFE =
    '<p onclick="alert(1)">Prize</p><img src="x" onerror="alert(document.domain)"><script>alert(1)</script>';

  it('sanitises the description and keeps the other setup fields', () => {
    expect(
      sanitizeSweepstakesInput({
        id: SWEEPSTAKES_ID,
        setup: { name: 'Bike', description: UNSAFE, banner: 'b.png' }
      })
    ).toEqual({
      id: SWEEPSTAKES_ID,
      setup: { name: 'Bike', description: '<p>Prize</p>', banner: 'b.png' }
    });
  });

  it('sanitises the text of custom terms', () => {
    expect(
      sanitizeSweepstakesInput({
        id: SWEEPSTAKES_ID,
        terms: { type: SweepstakesTermsType.CUSTOM, text: UNSAFE }
      }).terms
    ).toEqual({ type: SweepstakesTermsType.CUSTOM, text: '<p>Prize</p>' });
  });

  it('leaves template terms unchanged', () => {
    const terms = {
      type: SweepstakesTermsType.TEMPLATE,
      sponsorName: 'Acme',
      additionalTerms: 'Be <nice>'
    };

    expect(sanitizeSweepstakesInput({ id: SWEEPSTAKES_ID, terms }).terms).toBe(
      terms
    );
  });

  it('keeps the markup the rich text editor produces', () => {
    const description =
      '<h2 style="text-align: center;">Win</h2><ul><li><p><a target="_blank" rel="noopener noreferrer nofollow" href="https://giveaway.dog">Rules</a></p></li></ul>';

    expect(
      sanitizeSweepstakesInput({ id: SWEEPSTAKES_ID, setup: { description } })
        .setup?.description
    ).toBe(description);
  });

  it('leaves missing and non string fields for the database to reject', () => {
    const input = {
      id: SWEEPSTAKES_ID,
      setup: { name: 'Bike', description: 42 },
      terms: { type: SweepstakesTermsType.CUSTOM }
    } as unknown as Parameters<typeof sanitizeSweepstakesInput>[0];

    expect(sanitizeSweepstakesInput(input)).toEqual(input);
  });

  it('keeps the input without setup or terms as it is', () => {
    expect(
      sanitizeSweepstakesInput({
        id: SWEEPSTAKES_ID,
        status: SweepstakesStatus.ACTIVE
      })
    ).toEqual({
      id: SWEEPSTAKES_ID,
      status: SweepstakesStatus.ACTIVE,
      setup: undefined,
      terms: undefined
    });
  });
});

describe('applySweepstakesChanges', () => {
  const apply = (
    input: Parameters<typeof applySweepstakesChanges>[0]['input'] = {
      id: SWEEPSTAKES_ID
    }
  ) => applySweepstakesChanges({ db, user: TEST_USER, input });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    prismaMock.sweepstakes.findUnique.mockResolvedValue(buildTeamSweepstakes());
    stubSweepstakesRewrite(prismaMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('authorization and guards', () => {
    it('looks up the input sweepstakes scoped to the caller', async () => {
      await apply({ id: 'sweep-42' });

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'sweep-42',
          team: { members: { some: { userId: TEST_USER.id } } }
        },
        include: TEAM_SWEEPSTAKES_PAYLOAD
      });
    });

    it('requires the update permission on the sweepstakes team', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({
          team: buildTeam({
            members: [buildMembership({ role: TeamRole.GUEST })]
          })
        })
      );

      await expect(apply()).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message:
          'You do not have permission to perform this action. Required permission: UPDATE_SWEEPSTAKES'
      });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('propagates NOT_FOUND when the sweepstakes is missing', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      await expect(apply()).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Sweepstakes not found'
      });
    });

    it('rejects making a sweepstakes public when its team has no id', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({ team: buildTeam({ id: '' }) })
      );

      await expect(
        apply({
          id: SWEEPSTAKES_ID,
          visibility: { visibility: VisibilityType.PUBLIC }
        })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message:
          'Sweepstakes must belong to a team to be made public. Please contact support at /support for assistance.'
      });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('allows a non public visibility even when the team has no id', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({ team: buildTeam({ id: '' }) })
      );

      await apply({
        id: SWEEPSTAKES_ID,
        visibility: { visibility: VisibilityType.UNLISTED }
      });

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    });

    it('allows making a sweepstakes public when it belongs to a team', async () => {
      await apply({
        id: SWEEPSTAKES_ID,
        visibility: { visibility: VisibilityType.PUBLIC, slug: 'my-slug' }
      });

      expect(prismaMock.sweepstakes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            visibility: {
              create: { visibility: VisibilityType.PUBLIC, slug: 'my-slug' }
            }
          })
        })
      );
    });

    it('refuses to modify a completed sweepstakes', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({ status: SweepstakesStatus.COMPLETED })
      );

      await expect(apply()).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: 'Completed sweepstakes cannot be modified.'
      });
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
      expect(prismaMock.sweepstakes.delete).not.toHaveBeenCalled();
    });
  });

  describe('rewrite transaction', () => {
    it('runs inside a transaction with 30 second wait and timeout limits', async () => {
      await apply();

      expect(prismaMock.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        { maxWait: 30000, timeout: 30000 }
      );
    });

    it('returns the original sweepstakes and its team', async () => {
      const sweepstakes = buildTeamSweepstakes();
      prismaMock.sweepstakes.findUnique.mockResolvedValue(sweepstakes);

      const result = await apply();

      expect(result).toEqual({ sweepstakes, team: sweepstakes.team });
    });

    it('reads every dependent record scoped to the sweepstakes before deleting it', async () => {
      await apply();

      expect(prismaMock.sweepstakesParticipant.findMany).toHaveBeenCalledWith({
        where: { sweepstakesId: SWEEPSTAKES_ID }
      });
      expect(prismaMock.taskCompletion.findMany).toHaveBeenCalledWith({
        where: { task: { sweepstakesId: SWEEPSTAKES_ID } }
      });
      expect(prismaMock.sweepstakesFormValue.findMany).toHaveBeenCalledWith({
        where: { participant: { sweepstakesId: SWEEPSTAKES_ID } }
      });
      expect(prismaMock.sweepstakesJob.findMany).toHaveBeenCalledWith({
        where: { sweepstakesId: SWEEPSTAKES_ID }
      });
      expect(prismaMock.automatedPostJob.findMany).toHaveBeenCalledWith({
        where: { sweepstakesId: SWEEPSTAKES_ID }
      });
      expect(prismaMock.referral.findMany).toHaveBeenCalledWith({
        where: { task: { sweepstakesId: SWEEPSTAKES_ID } }
      });
      expect(prismaMock.referredUser.findMany).toHaveBeenCalledWith({
        where: { referral: { task: { sweepstakesId: SWEEPSTAKES_ID } } }
      });
      expect(prismaMock.sweepstakesAllocation.findMany).toHaveBeenCalledWith({
        where: { participant: { sweepstakesId: SWEEPSTAKES_ID } }
      });
    });

    it('deletes the sweepstakes, recreates it, then restores participants in order', async () => {
      await apply();

      const deleteOrder =
        prismaMock.sweepstakes.delete.mock.invocationCallOrder[0];
      const createOrder =
        prismaMock.sweepstakes.create.mock.invocationCallOrder[0];
      const participantsOrder =
        prismaMock.sweepstakesParticipant.createMany.mock
          .invocationCallOrder[0];
      const completionsOrder =
        prismaMock.taskCompletion.createMany.mock.invocationCallOrder[0];
      const lastRead =
        prismaMock.sweepstakesAllocation.findMany.mock.invocationCallOrder[0];

      expect(lastRead).toBeLessThan(deleteOrder);
      expect(deleteOrder).toBeLessThan(createOrder);
      expect(createOrder).toBeLessThan(participantsOrder);
      expect(participantsOrder).toBeLessThan(completionsOrder);
    });

    it('deletes the sweepstakes by id', async () => {
      await apply();

      expect(prismaMock.sweepstakes.delete).toHaveBeenCalledWith({
        where: { id: SWEEPSTAKES_ID }
      });
    });

    it('recreates the sweepstakes from the storable input with nested includes', async () => {
      await apply({
        id: SWEEPSTAKES_ID,
        setup: { name: 'New name', description: 'Desc', banner: 'b.png' }
      });

      expect(prismaMock.sweepstakes.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: SWEEPSTAKES_ID,
          teamId: TEAM_ID,
          status: SweepstakesStatus.DRAFT,
          details: {
            create: { name: 'New name', description: 'Desc', banner: 'b.png' }
          }
        }),
        include: {
          tasks: true,
          criteria: true,
          prizes: true,
          audience: { include: { formFields: true } }
        }
      });
    });

    it('uses the input status over the stored status when provided', async () => {
      await apply({ id: SWEEPSTAKES_ID, status: SweepstakesStatus.ACTIVE });

      expect(prismaMock.sweepstakes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: SweepstakesStatus.ACTIVE })
        })
      );
    });

    it('keeps the stored sweepstakes id and team id even if the input differs', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({ id: 'stored-id', teamId: 'stored-team' })
      );

      await apply({ id: 'input-id' });

      expect(prismaMock.sweepstakes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            id: 'stored-id',
            teamId: 'stored-team'
          })
        })
      );
    });

    it('deletes the stored sweepstakes id even if the input id differs', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({ id: 'stored-id' })
      );

      await apply({ id: 'input-id' });

      expect(prismaMock.sweepstakes.delete).toHaveBeenCalledWith({
        where: { id: 'stored-id' }
      });
    });

    it('reads dependent records by the stored sweepstakes id even if the input id differs', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({ id: 'stored-id' })
      );

      await apply({ id: 'input-id' });

      expect(prismaMock.sweepstakesParticipant.findMany).toHaveBeenCalledWith({
        where: { sweepstakesId: 'stored-id' }
      });
    });

    it('schedules jobs for the stored sweepstakes id even if the input id differs', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({ id: 'stored-id' })
      );

      await apply({
        id: 'input-id',
        status: SweepstakesStatus.ACTIVE,
        timing: { endDate: END }
      });

      expect(prismaMock.sweepstakesJob.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            sweepstakesId_type: {
              sweepstakesId: 'stored-id',
              type: SweepstakesJobType.PROCESS_EXPIRATION
            }
          },
          create: expect.objectContaining({ sweepstakesId: 'stored-id' })
        })
      );
    });

    it('propagates errors raised inside the transaction', async () => {
      prismaMock.sweepstakes.create.mockRejectedValue(new Error('boom'));

      await expect(apply()).rejects.toThrow('boom');
      expect(
        prismaMock.sweepstakesParticipant.createMany
      ).not.toHaveBeenCalled();
    });
  });

  describe('restoring retained data', () => {
    it('restores every participant as a copy', async () => {
      const participant = {
        id: 'participant-1',
        userId: 'user-2',
        sweepstakesId: SWEEPSTAKES_ID,
        createdAt: NOW,
        updatedAt: NOW
      };
      prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([
        participant
      ]);

      await apply();

      const call =
        prismaMock.sweepstakesParticipant.createMany.mock.calls[0][0];
      expect(call).toEqual({ data: [participant] });
      expect(call.data[0]).not.toBe(participant);
    });

    it('creates participants even when there are none to restore', async () => {
      await apply();

      expect(prismaMock.sweepstakesParticipant.createMany).toHaveBeenCalledWith(
        { data: [] }
      );
    });

    it('restores only completions whose task still exists and maps null proof to undefined', async () => {
      stubSweepstakesRewrite(prismaMock, {
        tasks: [{ id: 'task-keep' }]
      });
      prismaMock.taskCompletion.findMany.mockResolvedValue([
        { id: 'c-1', taskId: 'task-keep', proof: { code: 'abc' } },
        { id: 'c-2', taskId: 'task-gone', proof: null },
        { id: 'c-3', taskId: 'task-keep', proof: null }
      ]);

      await apply();

      expect(prismaMock.taskCompletion.createMany).toHaveBeenCalledWith({
        data: [
          { id: 'c-1', taskId: 'task-keep', proof: { code: 'abc' } },
          { id: 'c-3', taskId: 'task-keep', proof: undefined }
        ]
      });
    });

    it('drops every completion when the recreated sweepstakes has no tasks', async () => {
      stubSweepstakesRewrite(prismaMock, { tasks: undefined });
      prismaMock.taskCompletion.findMany.mockResolvedValue([
        { id: 'c-1', taskId: 'task-keep', proof: null }
      ]);

      await apply();

      expect(prismaMock.taskCompletion.createMany).toHaveBeenCalledWith({
        data: []
      });
    });

    it('restores only form values whose field still exists', async () => {
      stubSweepstakesRewrite(prismaMock, {
        audience: { formFields: [{ id: 'field-keep' }] }
      });
      prismaMock.sweepstakesFormValue.findMany.mockResolvedValue([
        { id: 'v-1', fieldId: 'field-keep', value: 'a' },
        { id: 'v-2', fieldId: 'field-gone', value: 'b' }
      ]);

      await apply();

      expect(prismaMock.sweepstakesFormValue.createMany).toHaveBeenCalledWith({
        data: [{ id: 'v-1', fieldId: 'field-keep', value: 'a' }]
      });
    });

    it('skips restoring form values when none of their fields survive', async () => {
      stubSweepstakesRewrite(prismaMock, {
        audience: { formFields: [{ id: 'field-keep' }] }
      });
      prismaMock.sweepstakesFormValue.findMany.mockResolvedValue([
        { id: 'v-2', fieldId: 'field-gone', value: 'b' }
      ]);

      await apply();

      expect(prismaMock.sweepstakesFormValue.createMany).not.toHaveBeenCalled();
    });

    it('skips restoring form values when the recreated sweepstakes has no audience', async () => {
      stubSweepstakesRewrite(prismaMock, { audience: null });
      prismaMock.sweepstakesFormValue.findMany.mockResolvedValue([
        { id: 'v-1', fieldId: 'field-keep', value: 'a' }
      ]);

      await apply();

      expect(prismaMock.sweepstakesFormValue.createMany).not.toHaveBeenCalled();
    });

    it('skips restoring form values when the audience has no form fields', async () => {
      stubSweepstakesRewrite(prismaMock, { audience: {} });
      prismaMock.sweepstakesFormValue.findMany.mockResolvedValue([
        { id: 'v-1', fieldId: 'field-keep', value: 'a' }
      ]);

      await apply();

      expect(prismaMock.sweepstakesFormValue.createMany).not.toHaveBeenCalled();
    });

    it('restores sweepstakes jobs mapping null data and error to undefined', async () => {
      prismaMock.sweepstakesJob.findMany.mockResolvedValue([
        { id: 'j-1', data: null, error: null },
        { id: 'j-2', data: { step: 1 }, error: { reason: 'x' } }
      ]);

      await apply();

      expect(prismaMock.sweepstakesJob.createMany).toHaveBeenCalledWith({
        data: [
          { id: 'j-1', data: undefined, error: undefined },
          { id: 'j-2', data: { step: 1 }, error: { reason: 'x' } }
        ]
      });
    });

    it('does not restore sweepstakes jobs when there are none', async () => {
      await apply();

      expect(prismaMock.sweepstakesJob.createMany).not.toHaveBeenCalled();
    });

    it('restores automated post jobs mapping null request and response to undefined', async () => {
      prismaMock.automatedPostJob.findMany.mockResolvedValue([
        { id: 'p-1', request: null, response: null },
        { id: 'p-2', request: { text: 'hi' }, response: { ok: true } }
      ]);

      await apply();

      expect(prismaMock.automatedPostJob.createMany).toHaveBeenCalledWith({
        data: [
          { id: 'p-1', request: undefined, response: undefined },
          { id: 'p-2', request: { text: 'hi' }, response: { ok: true } }
        ]
      });
    });

    it('does not restore automated post jobs when there are none', async () => {
      await apply();

      expect(prismaMock.automatedPostJob.createMany).not.toHaveBeenCalled();
    });

    it('restores referrals even when their task no longer exists', async () => {
      stubSweepstakesRewrite(prismaMock, { tasks: [{ id: 'task-keep' }] });
      prismaMock.referral.findMany.mockResolvedValue([
        { id: 'r-1', code: 'ABC', taskId: 'task-gone' }
      ]);

      await apply();

      expect(prismaMock.referral.createMany).toHaveBeenCalledWith({
        data: [{ id: 'r-1', code: 'ABC', taskId: 'task-gone' }]
      });
    });

    it('does not restore referrals when there are none', async () => {
      await apply();

      expect(prismaMock.referral.createMany).not.toHaveBeenCalled();
    });

    it('restores referred users when there are some', async () => {
      prismaMock.referredUser.findMany.mockResolvedValue([
        { id: 'ru-1', referralId: 'r-1', userId: 'user-3' }
      ]);

      await apply();

      expect(prismaMock.referredUser.createMany).toHaveBeenCalledWith({
        data: [{ id: 'ru-1', referralId: 'r-1', userId: 'user-3' }]
      });
    });

    it('does not restore referred users when there are none', async () => {
      await apply();

      expect(prismaMock.referredUser.createMany).not.toHaveBeenCalled();
    });

    it('restores allocations for surviving prizes when user selection is allowed', async () => {
      stubSweepstakesRewrite(prismaMock, {
        criteria: { allowUserSelection: true },
        prizes: [{ id: 'prize-keep' }]
      });
      prismaMock.sweepstakesAllocation.findMany.mockResolvedValue([
        { id: 'a-1', prizeId: 'prize-keep', participantId: 'participant-1' },
        { id: 'a-2', prizeId: 'prize-gone', participantId: 'participant-2' }
      ]);

      await apply();

      expect(prismaMock.sweepstakesAllocation.createMany).toHaveBeenCalledWith({
        data: [
          {
            id: 'a-1',
            prizeId: 'prize-keep',
            participantId: 'participant-1'
          }
        ]
      });
    });

    it('creates an empty allocation batch when the recreated sweepstakes has no prizes', async () => {
      stubSweepstakesRewrite(prismaMock, {
        criteria: { allowUserSelection: true },
        prizes: undefined
      });
      prismaMock.sweepstakesAllocation.findMany.mockResolvedValue([
        { id: 'a-1', prizeId: 'prize-keep', participantId: 'participant-1' }
      ]);

      await apply();

      expect(prismaMock.sweepstakesAllocation.createMany).toHaveBeenCalledWith({
        data: []
      });
    });

    it('drops allocations when user selection is not allowed', async () => {
      stubSweepstakesRewrite(prismaMock, {
        criteria: { allowUserSelection: false },
        prizes: [{ id: 'prize-keep' }]
      });
      prismaMock.sweepstakesAllocation.findMany.mockResolvedValue([
        { id: 'a-1', prizeId: 'prize-keep', participantId: 'participant-1' }
      ]);

      await apply();

      expect(
        prismaMock.sweepstakesAllocation.createMany
      ).not.toHaveBeenCalled();
    });

    it('drops allocations when the recreated sweepstakes has no criteria', async () => {
      stubSweepstakesRewrite(prismaMock, {
        criteria: null,
        prizes: [{ id: 'prize-keep' }]
      });
      prismaMock.sweepstakesAllocation.findMany.mockResolvedValue([
        { id: 'a-1', prizeId: 'prize-keep', participantId: 'participant-1' }
      ]);

      await apply();

      expect(
        prismaMock.sweepstakesAllocation.createMany
      ).not.toHaveBeenCalled();
    });

    it('does not restore allocations when there are none', async () => {
      stubSweepstakesRewrite(prismaMock, {
        criteria: { allowUserSelection: true },
        prizes: [{ id: 'prize-keep' }]
      });

      await apply();

      expect(
        prismaMock.sweepstakesAllocation.createMany
      ).not.toHaveBeenCalled();
    });
  });

  describe('sanitising rich text', () => {
    it('stores the description without unsafe markup', async () => {
      await apply({
        id: SWEEPSTAKES_ID,
        setup: {
          name: 'Bike',
          description:
            '<p>Win</p><img src="x" onerror="alert(document.domain)">',
          banner: 'b.png'
        }
      });

      expect(prismaMock.sweepstakes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            details: {
              create: {
                name: 'Bike',
                description: '<p>Win</p>',
                banner: 'b.png'
              }
            }
          })
        })
      );
    });

    it('stores custom terms without unsafe markup', async () => {
      await apply({
        id: SWEEPSTAKES_ID,
        terms: {
          type: SweepstakesTermsType.CUSTOM,
          text: '<p>Rules</p><a href="javascript:alert(1)">Click</a><iframe src="https://evil.example"></iframe>'
        }
      });

      expect(prismaMock.sweepstakes.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            terms: {
              create: {
                type: SweepstakesTermsType.CUSTOM,
                text: '<p>Rules</p><a>Click</a>'
              }
            }
          })
        })
      );
    });
  });

  describe('scheduling sweepstakes jobs', () => {
    it('schedules activation, modification and expiration jobs for an active sweepstakes with both dates', async () => {
      await apply({
        id: SWEEPSTAKES_ID,
        status: SweepstakesStatus.ACTIVE,
        timing: { startDate: START, endDate: END }
      });

      expect(prismaMock.sweepstakesJob.upsert.mock.calls).toEqual([
        [
          {
            where: {
              sweepstakesId_type: {
                sweepstakesId: SWEEPSTAKES_ID,
                type: SweepstakesJobType.PROCESS_ACTIVATION
              }
            },
            update: { runAt: START },
            create: {
              sweepstakesId: SWEEPSTAKES_ID,
              type: SweepstakesJobType.PROCESS_ACTIVATION,
              status: SweepstakesJobStatus.PENDING,
              runAt: START
            }
          }
        ],
        [
          {
            where: {
              sweepstakesId_type: {
                sweepstakesId: SWEEPSTAKES_ID,
                type: SweepstakesJobType.PROCESS_MODIFICATION
              }
            },
            update: { status: SweepstakesJobStatus.PENDING, runAt: NOW },
            create: {
              sweepstakesId: SWEEPSTAKES_ID,
              type: SweepstakesJobType.PROCESS_MODIFICATION,
              status: SweepstakesJobStatus.PENDING,
              runAt: NOW
            }
          }
        ],
        [
          {
            where: {
              sweepstakesId_type: {
                sweepstakesId: SWEEPSTAKES_ID,
                type: SweepstakesJobType.PROCESS_EXPIRATION
              }
            },
            update: { runAt: END },
            create: {
              sweepstakesId: SWEEPSTAKES_ID,
              type: SweepstakesJobType.PROCESS_EXPIRATION,
              status: SweepstakesJobStatus.PENDING,
              runAt: END
            }
          }
        ]
      ]);
    });

    it('schedules only the activation job when only a start date is provided', async () => {
      await apply({
        id: SWEEPSTAKES_ID,
        status: SweepstakesStatus.ACTIVE,
        timing: { startDate: START }
      });

      expect(prismaMock.sweepstakesJob.upsert).toHaveBeenCalledTimes(1);
      expect(prismaMock.sweepstakesJob.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            sweepstakesId_type: {
              sweepstakesId: SWEEPSTAKES_ID,
              type: SweepstakesJobType.PROCESS_ACTIVATION
            }
          }
        })
      );
    });

    it('schedules only the expiration job when only an end date is provided', async () => {
      await apply({
        id: SWEEPSTAKES_ID,
        status: SweepstakesStatus.ACTIVE,
        timing: { endDate: END }
      });

      expect(prismaMock.sweepstakesJob.upsert).toHaveBeenCalledTimes(1);
      expect(prismaMock.sweepstakesJob.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            sweepstakesId_type: {
              sweepstakesId: SWEEPSTAKES_ID,
              type: SweepstakesJobType.PROCESS_EXPIRATION
            }
          }
        })
      );
    });

    it('does not schedule jobs for an active sweepstakes without timing', async () => {
      await apply({ id: SWEEPSTAKES_ID, status: SweepstakesStatus.ACTIVE });

      expect(prismaMock.sweepstakesJob.upsert).not.toHaveBeenCalled();
    });

    it('does not schedule jobs when the input status is not active', async () => {
      await apply({
        id: SWEEPSTAKES_ID,
        status: SweepstakesStatus.DRAFT,
        timing: { startDate: START, endDate: END }
      });

      expect(prismaMock.sweepstakesJob.upsert).not.toHaveBeenCalled();
    });

    it('does not schedule jobs when the input has no status even if the stored sweepstakes is active', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(
        buildTeamSweepstakes({ status: SweepstakesStatus.ACTIVE })
      );

      await apply({
        id: SWEEPSTAKES_ID,
        timing: { startDate: START, endDate: END }
      });

      expect(prismaMock.sweepstakesJob.upsert).not.toHaveBeenCalled();
    });
  });
});
