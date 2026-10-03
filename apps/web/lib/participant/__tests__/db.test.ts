import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Prisma, type SweepstakesFormField } from '@prisma/client';
import { ApplicationError } from '@giveaway/util-errors';
import { USER_SCHEMA_SELECT_QUERY } from '@/schemas/user';
import { TASK_COMPLETIONS_SELECT_QUERY } from '@/lib/task/completions';
import type { SweepstakesFormFieldSchema } from '@/lib/custom-fields/schemas';
import { asPrismaClient, prismaMock } from '@giveaway/testing-server/prisma';
import {
  findOrCreateSweepstakesParticipant,
  findSweepstakesParticipant,
  listSweepstakesParticipants,
  listTeamParticipants,
  onlyParticipantsWithCompletions,
  sortCompletionsByMostRecent,
  sortParticipantsByMostRecentCompletion,
  SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY,
  TEAM_PARTICIPANT_USER_SELECT_QUERY,
  toParticipantFormValues,
  toParticipantProfile,
  toSweepstakesEngagement,
  toSweepstakesParticipant,
  toTeamParticipant,
  toTwitterLink
} from '../db';
import {
  BASE_DATE,
  bonusConfig,
  buildCompletion,
  buildCompletionRow,
  buildFormValueRow,
  buildParticipant,
  buildParticipantRow,
  buildTaskRow,
  buildUserRow,
  buildUserSchema,
  daysAfterBase
} from './fixtures-participant-referrals-automation';

const formFieldRow = (
  overrides: Partial<SweepstakesFormField> = {}
): SweepstakesFormField => ({
  id: 'f-1',
  audienceId: 'aud-1',
  label: 'Field',
  type: 'USERNAME',
  required: false,
  placeholder: null,
  minimum: null,
  maximum: null,
  index: 0,
  createdAt: BASE_DATE,
  updatedAt: BASE_DATE,
  ...overrides
});

const twitterField: SweepstakesFormFieldSchema = {
  id: 'f-twitter',
  label: 'Twitter',
  type: 'TWITTER',
  placeholder: null,
  required: false
};

const ageField: SweepstakesFormFieldSchema = {
  id: 'f-age',
  label: 'Age',
  type: 'AGE',
  required: true
};

const emailField: SweepstakesFormFieldSchema = {
  id: 'f-email',
  label: 'Email',
  type: 'EMAIL'
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('toParticipantFormValues', () => {
  it('maps each form value row to its field id', () => {
    expect(
      toParticipantFormValues([
        buildFormValueRow('f-1', 'Jane'),
        buildFormValueRow('f-2', '25')
      ])
    ).toEqual({ 'f-1': 'Jane', 'f-2': '25' });
  });

  it('returns an empty object for no rows', () => {
    expect(toParticipantFormValues([])).toEqual({});
  });

  it('keeps the last value when a field id repeats', () => {
    expect(
      toParticipantFormValues([
        buildFormValueRow('f-1', 'first'),
        buildFormValueRow('f-1', 'second')
      ])
    ).toEqual({ 'f-1': 'second' });
  });
});

describe('SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY', () => {
  it('includes the user, completions, form values and prize allocation', () => {
    expect(SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY).toEqual({
      user: { select: USER_SCHEMA_SELECT_QUERY },
      taskCompletions: { select: TASK_COMPLETIONS_SELECT_QUERY },
      formValues: true,
      allocations: {
        select: { prize: { select: { name: true, id: true } } }
      }
    });
  });
});

describe('toSweepstakesParticipant', () => {
  it('maps a participant row into the participant schema', () => {
    const participant = toSweepstakesParticipant(
      buildParticipantRow({
        taskCompletions: [buildCompletionRow()],
        formValues: [buildFormValueRow('f-1', 'Jane')],
        allocations: { prize: { id: 'prize-1', name: 'Laptop' } }
      })
    );

    expect(participant).toEqual({
      id: 'participant-1',
      user: buildUserSchema(),
      allocation: { prize: { id: 'prize-1', name: 'Laptop' } },
      completions: [buildCompletion()],
      formValues: { 'f-1': 'Jane' }
    });
  });

  it('orders completions from most recent to oldest', () => {
    const participant = toSweepstakesParticipant(
      buildParticipantRow({
        taskCompletions: [
          buildCompletionRow({ id: 'old', completedAt: daysAfterBase(1) }),
          buildCompletionRow({ id: 'new', completedAt: daysAfterBase(3) }),
          buildCompletionRow({ id: 'mid', completedAt: daysAfterBase(2) })
        ]
      })
    );

    expect(participant.completions.map((c) => c.id)).toEqual([
      'new',
      'mid',
      'old'
    ]);
  });

  it('returns a null allocation when there is none', () => {
    const participant = toSweepstakesParticipant(
      buildParticipantRow({ allocations: null })
    );

    expect(participant.allocation).toBeNull();
  });

  it('returns a null allocation when the prize has no name', () => {
    const participant = toSweepstakesParticipant(
      buildParticipantRow({ allocations: { prize: { id: 'p-1', name: null } } })
    );

    expect(participant.allocation).toBeNull();
  });

  it('returns a null allocation when the prize id is empty', () => {
    const participant = toSweepstakesParticipant(
      buildParticipantRow({
        allocations: { prize: { id: '', name: 'Laptop' } }
      })
    );

    expect(participant.allocation).toBeNull();
  });

  it('uses the default sweepstakes name when the completion has no details', () => {
    const participant = toSweepstakesParticipant(
      buildParticipantRow({
        taskCompletions: [buildCompletionRow({ details: null })]
      })
    );

    expect(participant.completions[0].sweepstake).toEqual({
      id: 'sweep-1',
      name: 'Untitled Sweepstakes'
    });
  });

  it('falls back to an unknown bonus task when the task config is invalid', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const participant = toSweepstakesParticipant(
      buildParticipantRow({
        taskCompletions: [
          buildCompletionRow({
            task: buildTaskRow({ id: 'broken', config: { type: 'NOPE' } })
          })
        ]
      })
    );

    expect(participant.completions[0].task).toEqual({
      type: 'BONUS_TASK',
      id: 'broken',
      title: 'Unknown Task',
      value: 1,
      mandatory: false,
      tasksRequired: 0
    });
  });
});

describe('findSweepstakesParticipant', () => {
  it('looks the participant up by user and sweepstakes', async () => {
    prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(null);

    await findSweepstakesParticipant({
      db: asPrismaClient(),
      userId: 'user-2',
      sweepstakesId: 'sweep-1'
    });

    expect(prismaMock.sweepstakesParticipant.findUnique).toHaveBeenCalledWith({
      where: {
        userId_sweepstakesId: { userId: 'user-2', sweepstakesId: 'sweep-1' }
      },
      include: SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY
    });
  });

  it('returns null when the participant does not exist', async () => {
    prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(null);

    const participant = await findSweepstakesParticipant({
      db: asPrismaClient(),
      userId: 'user-2',
      sweepstakesId: 'sweep-1'
    });

    expect(participant).toBeNull();
  });

  it('returns the mapped participant when found', async () => {
    prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(
      buildParticipantRow()
    );

    const participant = await findSweepstakesParticipant({
      db: asPrismaClient(),
      userId: 'user-2',
      sweepstakesId: 'sweep-1'
    });

    expect(participant).toEqual(buildParticipant());
  });
});

describe('findOrCreateSweepstakesParticipant', () => {
  const options = () => ({
    db: asPrismaClient(),
    userId: 'user-2',
    sweepstakesId: 'sweep-1'
  });

  const givenSweepstakesFormFields = (formFields: SweepstakesFormField[]) => {
    prismaMock.sweepstakes.findUnique.mockResolvedValue({
      audience: { formFields }
    });
  };

  beforeEach(() => {
    prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(null);
    prismaMock.user.findFirst.mockResolvedValue(buildUserRow());
    prismaMock.sweepstakesParticipant.create.mockResolvedValue(
      buildParticipantRow({ id: 'created-1' })
    );
    prismaMock.task.findMany.mockResolvedValue([]);
  });

  describe('when the participant already exists', () => {
    it('returns the existing participant without creating one', async () => {
      prismaMock.sweepstakesParticipant.findUnique.mockResolvedValue(
        buildParticipantRow({ id: 'existing-1' })
      );

      const participant = await findOrCreateSweepstakesParticipant(options());

      expect(participant).toEqual(buildParticipant({ id: 'existing-1' }));
      expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.sweepstakesParticipant.create).not.toHaveBeenCalled();
    });
  });

  describe('when the participant must be created', () => {
    it('loads the user with the user schema selection', async () => {
      givenSweepstakesFormFields([]);

      await findOrCreateSweepstakesParticipant(options());

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        select: USER_SCHEMA_SELECT_QUERY
      });
    });

    it('throws NOT_FOUND when the user does not exist', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const promise = findOrCreateSweepstakesParticipant(options());

      await expect(promise).rejects.toBeInstanceOf(ApplicationError);
      await expect(promise).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message:
          'User with ID user-2 not found when creating sweepstakes participant'
      });
      expect(prismaMock.sweepstakes.findUnique).not.toHaveBeenCalled();
    });

    it('loads the sweepstakes audience form fields', async () => {
      givenSweepstakesFormFields([]);

      await findOrCreateSweepstakesParticipant(options());

      expect(prismaMock.sweepstakes.findUnique).toHaveBeenCalledWith({
        where: { id: 'sweep-1' },
        select: { audience: { select: { formFields: true } } }
      });
    });

    it('throws NOT_FOUND when the sweepstakes does not exist', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue(null);

      await expect(
        findOrCreateSweepstakesParticipant(options())
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message:
          'Sweepstakes with ID sweep-1 not found when creating participant'
      });
      expect(prismaMock.sweepstakesParticipant.create).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND when the sweepstakes has no audience', async () => {
      prismaMock.sweepstakes.findUnique.mockResolvedValue({ audience: null });

      await expect(
        findOrCreateSweepstakesParticipant(options())
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message:
          'Sweepstakes with ID sweep-1 not found when creating participant'
      });
    });

    it('throws VALIDATION_ERROR when a form field is malformed', async () => {
      givenSweepstakesFormFields([formFieldRow({ id: 'f-bad', type: null })]);

      await expect(
        findOrCreateSweepstakesParticipant(options())
      ).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: 'Invalid form field data for field ID f-bad'
      });
      expect(prismaMock.sweepstakesParticipant.create).not.toHaveBeenCalled();
    });

    it('creates the participant with no form values when there are no fields', async () => {
      givenSweepstakesFormFields([]);

      await findOrCreateSweepstakesParticipant(options());

      expect(prismaMock.sweepstakesParticipant.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-2',
          sweepstakesId: 'sweep-1',
          formValues: { createMany: { data: [] } }
        },
        include: SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY
      });
    });

    it('prefills form values from the user profile and skips empty ones', async () => {
      prismaMock.user.findFirst.mockResolvedValue(
        buildUserRow({
          birthday: new Date('1990-01-01T00:00:00.000Z'),
          accounts: [
            {
              provider: 'twitter',
              scope: null,
              label: '@jane',
              link: 'https://x.com/jane',
              status: 'ACTIVE'
            }
          ]
        })
      );
      givenSweepstakesFormFields([
        formFieldRow({ id: 'f-name', type: 'USERNAME' }),
        formFieldRow({ id: 'f-email', type: 'EMAIL' }),
        formFieldRow({ id: 'f-age', type: 'AGE', minimum: 18 }),
        formFieldRow({ id: 'f-twitter', type: 'TWITTER' }),
        formFieldRow({ id: 'f-age-no-min', type: 'AGE' })
      ]);

      await findOrCreateSweepstakesParticipant(options());

      expect(
        prismaMock.sweepstakesParticipant.create.mock.calls[0][0].data
          .formValues
      ).toEqual({
        createMany: {
          data: [
            { fieldId: 'f-name', value: 'Jane Doe' },
            { fieldId: 'f-email', value: 'jane@example.com' },
            { fieldId: 'f-age', value: 'true' },
            { fieldId: 'f-twitter', value: 'https://x.com/jane' }
          ]
        }
      });
    });

    it('omits values the user profile cannot provide', async () => {
      prismaMock.user.findFirst.mockResolvedValue(
        buildUserRow({ name: null, email: null })
      );
      givenSweepstakesFormFields([
        formFieldRow({ id: 'f-name', type: 'USERNAME' }),
        formFieldRow({ id: 'f-email', type: 'EMAIL' }),
        formFieldRow({ id: 'f-twitter', type: 'TWITTER' })
      ]);

      await findOrCreateSweepstakesParticipant(options());

      expect(
        prismaMock.sweepstakesParticipant.create.mock.calls[0][0].data
          .formValues
      ).toEqual({ createMany: { data: [] } });
    });

    it('returns the created participant mapped to the schema', async () => {
      givenSweepstakesFormFields([]);

      const participant = await findOrCreateSweepstakesParticipant(options());

      expect(participant).toEqual(buildParticipant({ id: 'created-1' }));
    });
  });

  describe('when auto-completing the profile bonus task', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    it('never checks tasks when the sweepstakes has form fields, even if the profile fills them', async () => {
      givenSweepstakesFormFields([
        formFieldRow({ id: 'f-name', type: 'USERNAME', required: true })
      ]);

      await findOrCreateSweepstakesParticipant(options());

      expect(prismaMock.task.findMany).not.toHaveBeenCalled();
      expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
    });

    it('loads the sweepstakes tasks when there are no form fields', async () => {
      givenSweepstakesFormFields([]);

      await findOrCreateSweepstakesParticipant(options());

      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        where: { sweepstakesId: 'sweep-1' }
      });
    });

    it('completes the profile task for the new participant', async () => {
      givenSweepstakesFormFields([]);
      prismaMock.task.findMany.mockResolvedValue([
        buildTaskRow({ id: 'bonus', config: bonusConfig() }),
        buildTaskRow({ id: 'broken', config: { type: 'NOT_A_TASK' } }),
        buildTaskRow({
          id: 'profile',
          config: bonusConfig({ type: 'BONUS_COMPLETE_PROFILE' })
        })
      ]);
      prismaMock.taskCompletion.findFirst.mockResolvedValue(null);

      await findOrCreateSweepstakesParticipant(options());

      expect(prismaMock.taskCompletion.findFirst).toHaveBeenCalledWith({
        where: { participantId: 'created-1', taskId: 'profile' }
      });
      expect(prismaMock.taskCompletion.create).toHaveBeenCalledWith({
        data: {
          participantId: 'created-1',
          taskId: 'profile',
          status: 'COMPLETED',
          proof: Prisma.JsonNull
        }
      });
    });

    it('stores the auto-completed task proof as a JSON null', async () => {
      givenSweepstakesFormFields([]);
      prismaMock.task.findMany.mockResolvedValue([
        buildTaskRow({
          id: 'profile',
          config: bonusConfig({ type: 'BONUS_COMPLETE_PROFILE' })
        })
      ]);
      prismaMock.taskCompletion.findFirst.mockResolvedValue(null);

      await findOrCreateSweepstakesParticipant(options());

      const [args] = prismaMock.taskCompletion.create.mock.calls[0];
      expect(args.data.proof).toBe(Prisma.JsonNull);
    });

    it('does not complete the profile task twice', async () => {
      givenSweepstakesFormFields([]);
      prismaMock.task.findMany.mockResolvedValue([
        buildTaskRow({
          id: 'profile',
          config: bonusConfig({ type: 'BONUS_COMPLETE_PROFILE' })
        })
      ]);
      prismaMock.taskCompletion.findFirst.mockResolvedValue({ id: 'tc-1' });

      await findOrCreateSweepstakesParticipant(options());

      expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
    });

    it('skips the completion lookup when there is no profile task', async () => {
      givenSweepstakesFormFields([]);
      prismaMock.task.findMany.mockResolvedValue([
        buildTaskRow({ id: 'broken', config: null })
      ]);

      await findOrCreateSweepstakesParticipant(options());

      expect(prismaMock.taskCompletion.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.taskCompletion.create).not.toHaveBeenCalled();
    });

    it('returns the participant as created, without the auto-completed task', async () => {
      givenSweepstakesFormFields([]);
      prismaMock.task.findMany.mockResolvedValue([
        buildTaskRow({
          id: 'profile',
          config: bonusConfig({ type: 'BONUS_COMPLETE_PROFILE' })
        })
      ]);
      prismaMock.taskCompletion.findFirst.mockResolvedValue(null);

      const participant = await findOrCreateSweepstakesParticipant(options());

      expect(participant.completions).toEqual([]);
    });
  });
});

describe('sortCompletionsByMostRecent', () => {
  it('returns a positive number when the second completion is newer', () => {
    const a = buildCompletion({ completedAt: daysAfterBase(1) });
    const b = buildCompletion({ completedAt: daysAfterBase(2) });

    expect(sortCompletionsByMostRecent(a, b)).toBe(24 * 60 * 60 * 1000);
  });

  it('returns zero for completions at the same time', () => {
    const a = buildCompletion();
    const b = buildCompletion();

    expect(sortCompletionsByMostRecent(a, b)).toBe(0);
  });

  it('sorts newest first', () => {
    const sorted = [
      buildCompletion({ id: 'a', completedAt: daysAfterBase(1) }),
      buildCompletion({ id: 'b', completedAt: daysAfterBase(5) }),
      buildCompletion({ id: 'c', completedAt: daysAfterBase(3) })
    ].sort(sortCompletionsByMostRecent);

    expect(sorted.map((c) => c.id)).toEqual(['b', 'c', 'a']);
  });
});

describe('sortParticipantsByMostRecentCompletion', () => {
  const withCompletionsOn = (id: string, days: number[]) =>
    buildParticipant({
      id,
      completions: days.map((d) =>
        buildCompletion({ completedAt: daysAfterBase(d) })
      )
    });

  it('returns zero when neither participant has completions', () => {
    expect(
      sortParticipantsByMostRecentCompletion(
        withCompletionsOn('a', []),
        withCompletionsOn('b', [])
      )
    ).toBe(0);
  });

  it('places a participant without completions after one with completions', () => {
    expect(
      sortParticipantsByMostRecentCompletion(
        withCompletionsOn('a', []),
        withCompletionsOn('b', [1])
      )
    ).toBe(1);
  });

  it('places a participant with completions before one without', () => {
    expect(
      sortParticipantsByMostRecentCompletion(
        withCompletionsOn('a', [1]),
        withCompletionsOn('b', [])
      )
    ).toBe(-1);
  });

  it('compares the latest completion of each participant', () => {
    expect(
      sortParticipantsByMostRecentCompletion(
        withCompletionsOn('a', [1, 4, 2]),
        withCompletionsOn('b', [3])
      )
    ).toBe(-1 * 24 * 60 * 60 * 1000);
  });

  it('sorts participants by most recent activity with inactive ones last', () => {
    const sorted = [
      withCompletionsOn('inactive', []),
      withCompletionsOn('old', [1]),
      withCompletionsOn('recent', [2, 9]),
      withCompletionsOn('middle', [5])
    ].sort(sortParticipantsByMostRecentCompletion);

    expect(sorted.map((p) => p.id)).toEqual([
      'recent',
      'middle',
      'old',
      'inactive'
    ]);
  });
});

describe('listSweepstakesParticipants', () => {
  it('queries participants of the sweepstakes with the participant include', async () => {
    prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([]);

    await listSweepstakesParticipants({
      db: asPrismaClient(),
      sweepstakesId: 'sweep-1'
    });

    expect(prismaMock.sweepstakesParticipant.findMany).toHaveBeenCalledWith({
      where: { sweepstakesId: 'sweep-1' },
      include: SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY
    });
  });

  it('maps every participant row', async () => {
    prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([
      buildParticipantRow({ id: 'p-1' }),
      buildParticipantRow({ id: 'p-2' })
    ]);

    const participants = await listSweepstakesParticipants({
      db: asPrismaClient(),
      sweepstakesId: 'sweep-1'
    });

    expect(participants).toEqual([
      buildParticipant({ id: 'p-1' }),
      buildParticipant({ id: 'p-2' })
    ]);
  });
});

describe('listTeamParticipants', () => {
  it('queries participants of sweepstakes owned by a team the user belongs to', async () => {
    prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([]);

    await listTeamParticipants({
      db: asPrismaClient(),
      slug: 'acme',
      userId: 'user-1'
    });

    expect(prismaMock.sweepstakesParticipant.findMany).toHaveBeenCalledWith({
      where: {
        sweepstakes: {
          team: { slug: 'acme', members: { some: { userId: 'user-1' } } }
        }
      },
      include: SWEEPSTAKES_PARTICIPANT_INCLUDE_QUERY
    });
  });

  it('maps every participant row', async () => {
    prismaMock.sweepstakesParticipant.findMany.mockResolvedValue([
      buildParticipantRow({ id: 'p-1' })
    ]);

    const participants = await listTeamParticipants({
      db: asPrismaClient(),
      slug: 'acme',
      userId: 'user-1'
    });

    expect(participants).toEqual([buildParticipant({ id: 'p-1' })]);
  });
});

describe('toSweepstakesEngagement', () => {
  const completions = (count: number) =>
    Array.from({ length: count }, (_, i) => buildCompletion({ id: `tc-${i}` }));

  it('returns zero when the total is null', () => {
    expect(toSweepstakesEngagement(completions(2), null)).toBe(0);
  });

  it('returns zero when the total is zero', () => {
    expect(toSweepstakesEngagement(completions(2), 0)).toBe(0);
  });

  it('returns the rounded percentage of completed tasks', () => {
    expect(toSweepstakesEngagement(completions(1), 3)).toBe(33);
    expect(toSweepstakesEngagement(completions(2), 3)).toBe(67);
  });

  it('returns zero when nothing is completed', () => {
    expect(toSweepstakesEngagement([], 4)).toBe(0);
  });

  it('can exceed one hundred when completions outnumber tasks', () => {
    expect(toSweepstakesEngagement(completions(3), 2)).toBe(150);
  });
});

describe('onlyParticipantsWithCompletions', () => {
  it('keeps participants with at least one completion', () => {
    expect(
      onlyParticipantsWithCompletions(
        buildParticipant({ completions: [buildCompletion()] })
      )
    ).toBe(true);
  });

  it('drops participants without completions', () => {
    expect(onlyParticipantsWithCompletions(buildParticipant())).toBe(false);
  });
});

describe('TEAM_PARTICIPANT_USER_SELECT_QUERY', () => {
  it('extends the user selection with completions scoped to the team', () => {
    expect(TEAM_PARTICIPANT_USER_SELECT_QUERY({ slug: 'acme' })).toEqual({
      ...USER_SCHEMA_SELECT_QUERY,
      participation: {
        select: {
          taskCompletions: {
            select: TASK_COMPLETIONS_SELECT_QUERY,
            where: { task: { sweepstakes: { team: { slug: 'acme' } } } }
          }
        }
      }
    });
  });
});

describe('toTeamParticipant', () => {
  it('uses the user id as participant id and flattens every participation', () => {
    const participant = toTeamParticipant({
      ...buildUserRow(),
      participation: [
        {
          taskCompletions: [
            buildCompletionRow({ id: 'a', completedAt: daysAfterBase(1) })
          ]
        },
        { taskCompletions: [] },
        {
          taskCompletions: [
            buildCompletionRow({ id: 'b', completedAt: daysAfterBase(3) })
          ]
        }
      ]
    });

    expect(participant).toEqual({
      id: 'user-2',
      user: buildUserSchema(),
      allocation: null,
      completions: [
        buildCompletion({ id: 'a', completedAt: daysAfterBase(1) }),
        buildCompletion({ id: 'b', completedAt: daysAfterBase(3) })
      ],
      formValues: {}
    });
  });

  it('keeps every completion of a participation in query order', () => {
    const participant = toTeamParticipant({
      ...buildUserRow(),
      participation: [
        {
          taskCompletions: [
            buildCompletionRow({ id: 'a', completedAt: daysAfterBase(1) }),
            buildCompletionRow({ id: 'b', completedAt: daysAfterBase(5) })
          ]
        },
        {
          taskCompletions: [
            buildCompletionRow({ id: 'c', completedAt: daysAfterBase(3) })
          ]
        }
      ]
    });

    expect(participant.completions.map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });

  it('returns no completions for a user without participation', () => {
    const participant = toTeamParticipant({
      ...buildUserRow(),
      participation: []
    });

    expect(participant.completions).toEqual([]);
  });
});

describe('toParticipantProfile', () => {
  it('resolves each known field with its label, type and stringified value', () => {
    const profile = toParticipantProfile([twitterField, ageField, emailField], {
      'f-age': 25,
      'f-twitter': 'https://x.com/jane',
      'f-email': true
    });

    expect(profile).toEqual([
      { fieldId: 'f-age', label: 'Age', type: 'AGE', value: '25' },
      {
        fieldId: 'f-twitter',
        label: 'Twitter',
        type: 'TWITTER',
        value: 'https://x.com/jane'
      },
      { fieldId: 'f-email', label: 'Email', type: 'EMAIL', value: 'true' }
    ]);
  });

  it('skips values whose field is unknown', () => {
    expect(toParticipantProfile([ageField], { 'f-unknown': 'x' })).toEqual([]);
  });

  it('skips null and undefined values', () => {
    expect(
      toParticipantProfile([ageField, emailField], {
        'f-age': null,
        'f-email': undefined
      })
    ).toEqual([]);
  });

  it('keeps values verbatim without trimming', () => {
    expect(
      toParticipantProfile([emailField], { 'f-email': '  jane@example.com ' })
    ).toEqual([
      {
        fieldId: 'f-email',
        label: 'Email',
        type: 'EMAIL',
        value: '  jane@example.com '
      }
    ]);
  });

  it('keeps empty string values', () => {
    expect(toParticipantProfile([emailField], { 'f-email': '' })).toEqual([
      { fieldId: 'f-email', label: 'Email', type: 'EMAIL', value: '' }
    ]);
  });

  it('returns an empty profile when there are no values', () => {
    expect(toParticipantProfile([ageField], {})).toEqual([]);
  });
});

describe('toTwitterLink', () => {
  it('returns the value of the twitter field', () => {
    expect(
      toTwitterLink([ageField, twitterField], {
        'f-age': 30,
        'f-twitter': 'https://x.com/jane'
      })
    ).toBe('https://x.com/jane');
  });

  it('returns null when there is no twitter value', () => {
    expect(toTwitterLink([ageField, twitterField], { 'f-age': 30 })).toBeNull();
  });

  it('returns null when the twitter value is empty', () => {
    expect(toTwitterLink([twitterField], { 'f-twitter': '' })).toBeNull();
  });
});
