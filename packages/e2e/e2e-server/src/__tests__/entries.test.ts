import { beforeEach, describe, expect, it } from 'vitest';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import { e2eSweepstakesRequestSchema } from '@giveaway/e2e-model/requests';
import { seedE2eEntries } from '../entries';
import { NOW } from './fixtures';

const db = asPrismaClient();
const ID = 'sw-e2e';
const TASKS = [{ id: 'task-0' }, { id: 'task-1' }];
const PRIZES = [{ id: 'prize-0' }, { id: 'prize-1' }];
const FORM_FIELDS = [{ id: 'field-0' }, { id: 'field-1' }];
const NANOID = /^[\w-]{21}$/;

const parse = (request: Record<string, unknown>) =>
  e2eSweepstakesRequestSchema.parse({
    ns: 'abc123w0',
    team: 'e2e-abc123-w0',
    tasks: [{ type: 'BONUS_TASK' }, { type: 'REFERRAL_LINK' }],
    prizes: [{ name: 'A mug' }, { name: 'A hat' }],
    audience: {
      formFields: [
        { type: 'EMAIL', label: 'Email' },
        { type: 'USERNAME', label: 'Name' }
      ]
    },
    ...request
  });

const seed = (request: Record<string, unknown>) =>
  seedE2eEntries({
    db,
    request: parse(request),
    sweepstakesId: ID,
    tasks: TASKS,
    prizes: PRIZES,
    formFields: FORM_FIELDS,
    now: NOW
  });

const dataOf = (mock: { mock: { calls: unknown[][] } }) =>
  (mock.mock.calls[0][0] as { data: Record<string, unknown>[] }).data;

beforeEach(() => {
  prismaMock.user.upsert.mockImplementation((async (args: {
    where: { email: string };
  }) => ({
    id: `user-${args.where.email.split('@')[0]}`,
    email: args.where.email
  })) as never);
  prismaMock.referral.findUnique.mockResolvedValue(null);
});

describe('seedE2eEntries', () => {
  it('writes nothing for a giveaway without entries', async () => {
    expect(await seed({})).toEqual({ entries: [], draws: [], referrals: [] });
    expect(prismaMock.user.upsert).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('signs up the persona of each entry in its namespace', async () => {
    await seed({
      entries: [
        { persona: 'participant' },
        { persona: 'newbie', ns: 'abc123p1' }
      ]
    });

    expect(prismaMock.user.upsert).toHaveBeenNthCalledWith(1, {
      where: { email: 'e2e-participant-abc123w0@example.com' },
      update: { accountType: 'PARTICIPANT', onboarded: true },
      create: {
        email: 'e2e-participant-abc123w0@example.com',
        emailVerified: NOW,
        name: 'E2E participant',
        accountType: 'PARTICIPANT',
        onboarded: true
      },
      select: { id: true, email: true }
    });
    expect(prismaMock.user.upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { email: 'e2e-newbie-abc123p1@example.com' }
      })
    );
  });

  it('writes the participants, completions, values, scores and allocations in one transaction', async () => {
    await seed({
      criteria: { allowUserSelection: true },
      entries: [
        {
          persona: 'participant',
          completions: [
            { task: 1, status: 'PENDING', proof: { url: 'https://x.test' } },
            { task: 0, status: 'REJECTED', reason: 'Fake' }
          ],
          formValues: [{ field: 1, value: 'alice' }],
          quality: 80,
          prize: 1
        },
        { persona: 'participant2', completions: [{ task: 0 }] }
      ]
    });

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.$transaction.mock.calls[0][0]).toHaveLength(8);

    const participants = dataOf(prismaMock.sweepstakesParticipant.createMany);
    expect(participants).toEqual([
      {
        id: expect.stringMatching(NANOID),
        userId: 'user-e2e-participant-abc123w0',
        sweepstakesId: ID
      },
      {
        id: expect.stringMatching(NANOID),
        userId: 'user-e2e-participant2-abc123w0',
        sweepstakesId: ID
      }
    ]);
    const [first, second] = participants.map((p) => p.id);
    expect(first).not.toBe(second);

    expect(dataOf(prismaMock.taskCompletion.createMany)).toEqual([
      {
        id: expect.stringMatching(NANOID),
        participantId: first,
        taskId: 'task-1',
        status: 'PENDING',
        proof: { url: 'https://x.test' },
        reason: undefined
      },
      {
        id: expect.stringMatching(NANOID),
        participantId: first,
        taskId: 'task-0',
        status: 'REJECTED',
        proof: undefined,
        reason: 'Fake'
      },
      {
        id: expect.stringMatching(NANOID),
        participantId: second,
        taskId: 'task-0',
        status: 'COMPLETED',
        proof: undefined,
        reason: undefined
      }
    ]);
    expect(dataOf(prismaMock.sweepstakesFormValue.createMany)).toEqual([
      { participantId: first, fieldId: 'field-1', value: 'alice' }
    ]);
    expect(dataOf(prismaMock.userQuality.createMany)).toEqual([
      { userId: 'user-e2e-participant-abc123w0', score: 80 }
    ]);
    expect(dataOf(prismaMock.sweepstakesAllocation.createMany)).toEqual([
      { participantId: first, prizeId: 'prize-1' }
    ]);
  });

  it('gives each referral a code of the app and links the users it referred', async () => {
    const result = await seed({
      entries: [
        { persona: 'participant' },
        { persona: 'participant2' },
        { persona: 'newbie' }
      ],
      referrals: [{ entry: 0, task: 1, referred: [1, 2] }]
    });

    const [referral] = dataOf(prismaMock.referral.createMany);
    const participants = dataOf(prismaMock.sweepstakesParticipant.createMany);
    expect(referral).toEqual({
      id: expect.stringMatching(NANOID),
      code: expect.stringMatching(/^[\w-]{6}$/),
      participantId: participants[0].id,
      taskId: 'task-1'
    });
    expect(prismaMock.referral.findUnique).toHaveBeenCalledWith({
      where: { code: referral.code }
    });
    expect(dataOf(prismaMock.referredUser.createMany)).toEqual([
      { referralId: referral.id, userId: 'user-e2e-participant2-abc123w0' },
      { referralId: referral.id, userId: 'user-e2e-newbie-abc123w0' }
    ]);
    expect(result.referrals).toEqual([
      { entry: 0, taskId: 'task-1', code: referral.code }
    ]);
  });

  it('draws each prize for a completion of the entry, and chains the re-rolls', async () => {
    const result = await seed({
      entries: [
        { persona: 'participant', completions: [{ task: 1 }, { task: 0 }] },
        { persona: 'participant2', completions: [{ task: 0 }] }
      ],
      draws: [
        { entry: 0, prize: 1, result: 'DISQUALIFIED', reason: 'Bot' },
        { entry: 1, prize: 1, previous: 0 },
        { entry: 0, prize: 0, task: 0 }
      ]
    });

    const completions = dataOf(prismaMock.taskCompletion.createMany);
    const draws = dataOf(prismaMock.prizeDraw.createMany);
    expect(draws).toEqual([
      {
        id: expect.stringMatching(NANOID),
        prizeId: 'prize-1',
        taskCompletionId: completions[0].id,
        result: 'DISQUALIFIED',
        disqualificationReason: 'Bot',
        previousDrawId: undefined
      },
      {
        id: expect.stringMatching(NANOID),
        prizeId: 'prize-1',
        taskCompletionId: completions[2].id,
        result: 'WINNER',
        disqualificationReason: undefined,
        previousDrawId: draws[0].id
      },
      {
        id: expect.stringMatching(NANOID),
        prizeId: 'prize-0',
        taskCompletionId: completions[1].id,
        result: 'WINNER',
        disqualificationReason: undefined,
        previousDrawId: undefined
      }
    ]);
    expect(result.draws).toEqual([
      {
        id: draws[0].id,
        entry: 0,
        prizeId: 'prize-1',
        result: 'DISQUALIFIED',
        previousDrawId: null
      },
      {
        id: draws[1].id,
        entry: 1,
        prizeId: 'prize-1',
        result: 'WINNER',
        previousDrawId: draws[0].id
      },
      {
        id: draws[2].id,
        entry: 0,
        prizeId: 'prize-0',
        result: 'WINNER',
        previousDrawId: null
      }
    ]);
  });

  it('refuses a draw without a completion of its entry, and writes nothing', async () => {
    await expect(
      seedE2eEntries({
        db,
        request: {
          ns: 'abc123w0',
          entries: [
            { persona: 'participant', completions: [], formValues: [] }
          ],
          draws: [{ entry: 0, prize: 0, result: 'WINNER' }],
          referrals: []
        },
        sweepstakesId: ID,
        tasks: TASKS,
        prizes: PRIZES,
        formFields: FORM_FIELDS,
        now: NOW
      })
    ).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'A draw needs a completion of its entry'
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('returns the ids of each entry and its completions', async () => {
    const result = await seed({
      entries: [
        {
          persona: 'participant',
          ns: 'abc123p1',
          completions: [{ task: 0, status: 'PENDING' }]
        }
      ]
    });

    const [participant] = dataOf(prismaMock.sweepstakesParticipant.createMany);
    const [completion] = dataOf(prismaMock.taskCompletion.createMany);
    expect(result).toEqual({
      entries: [
        {
          persona: 'participant',
          ns: 'abc123p1',
          email: 'e2e-participant-abc123p1@example.com',
          userId: 'user-e2e-participant-abc123p1',
          participantId: participant.id,
          completions: [
            { id: completion.id, taskId: 'task-0', status: 'PENDING' }
          ]
        }
      ],
      draws: [],
      referrals: []
    });
  });
});
