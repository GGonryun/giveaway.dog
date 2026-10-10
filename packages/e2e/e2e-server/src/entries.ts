import 'server-only';

import { nanoid } from 'nanoid';
import { Prisma, PrismaClient } from '@giveaway/db-model';
import { toE2ePersonaUpsert } from '@giveaway/e2e-model/personas';
import {
  E2eDrawRequest,
  E2eEntryRequest,
  E2eReferralRequest,
  toE2eEntryNamespace
} from '@giveaway/e2e-model/requests';
import { generateReferral } from '@giveaway/referrals-server/shared';
import { ApplicationError } from '@giveaway/util-errors';

type E2eEntriesRequest = {
  ns: string;
  entries: E2eEntryRequest[];
  draws: E2eDrawRequest[];
  referrals: E2eReferralRequest[];
};

type Seeded = { id: string };

const toCompletionId = (
  entries: { completions: { task: number; id: string }[] }[],
  draw: E2eDrawRequest
) => {
  const { completions } = entries[draw.entry];
  const completion =
    draw.task === undefined
      ? completions[0]
      : completions.find((c) => c.task === draw.task);
  if (!completion) {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message: 'A draw needs a completion of its entry'
    });
  }
  return completion.id;
};

export const seedE2eEntries = async ({
  db,
  request,
  sweepstakesId,
  tasks,
  prizes,
  formFields,
  now
}: {
  db: PrismaClient;
  request: E2eEntriesRequest;
  sweepstakesId: string;
  tasks: Seeded[];
  prizes: Seeded[];
  formFields: Seeded[];
  now: Date;
}) => {
  if (request.entries.length === 0) {
    return { entries: [], draws: [], referrals: [] };
  }

  const users: { id: string; email: string | null }[] = [];
  for (const entry of request.entries) {
    const ns = toE2eEntryNamespace(request, entry);
    const user = await db.user.upsert({
      ...toE2ePersonaUpsert({ persona: entry.persona, ns, now }),
      select: { id: true, email: true }
    });
    users.push(user);
  }

  const entries = request.entries.map((entry, index) => ({
    persona: entry.persona,
    ns: toE2eEntryNamespace(request, entry),
    userId: users[index].id,
    email: users[index].email,
    participantId: nanoid(),
    completions: entry.completions.map((completion) => ({
      ...completion,
      id: nanoid(),
      taskId: tasks[completion.task].id
    }))
  }));

  const referrals = [];
  for (const referral of request.referrals) {
    referrals.push({
      ...referral,
      id: nanoid(),
      code: await generateReferral(db)
    });
  }

  const draws = request.draws.map((draw) => ({ ...draw, id: nanoid() }));

  await db.$transaction([
    db.sweepstakesParticipant.createMany({
      data: entries.map((entry) => ({
        id: entry.participantId,
        userId: entry.userId,
        sweepstakesId
      }))
    }),
    db.taskCompletion.createMany({
      data: entries.flatMap((entry) =>
        entry.completions.map((completion) => ({
          id: completion.id,
          participantId: entry.participantId,
          taskId: completion.taskId,
          status: completion.status,
          proof: completion.proof as Prisma.InputJsonObject | undefined,
          reason: completion.reason
        }))
      )
    }),
    db.sweepstakesFormValue.createMany({
      data: request.entries.flatMap((entry, index) =>
        entry.formValues.map((formValue) => ({
          participantId: entries[index].participantId,
          fieldId: formFields[formValue.field].id,
          value: formValue.value
        }))
      )
    }),
    db.userQuality.createMany({
      data: request.entries.flatMap((entry, index) =>
        entry.quality === undefined
          ? []
          : [{ userId: entries[index].userId, score: entry.quality }]
      )
    }),
    db.sweepstakesAllocation.createMany({
      data: request.entries.flatMap((entry, index) =>
        entry.prize === undefined
          ? []
          : [
              {
                participantId: entries[index].participantId,
                prizeId: prizes[entry.prize].id
              }
            ]
      )
    }),
    db.referral.createMany({
      data: referrals.map((referral) => ({
        id: referral.id,
        code: referral.code,
        participantId: entries[referral.entry].participantId,
        taskId: tasks[referral.task].id
      }))
    }),
    db.referredUser.createMany({
      data: referrals.flatMap((referral) =>
        referral.referred.map((referred) => ({
          referralId: referral.id,
          userId: entries[referred].userId
        }))
      )
    }),
    db.prizeDraw.createMany({
      data: draws.map((draw) => ({
        id: draw.id,
        prizeId: prizes[draw.prize].id,
        taskCompletionId: toCompletionId(entries, draw),
        result: draw.result,
        disqualificationReason: draw.reason,
        previousDrawId:
          draw.previous === undefined ? undefined : draws[draw.previous].id
      }))
    })
  ]);

  return {
    entries: entries.map((entry) => ({
      persona: entry.persona,
      ns: entry.ns,
      email: entry.email,
      userId: entry.userId,
      participantId: entry.participantId,
      completions: entry.completions.map((completion) => ({
        id: completion.id,
        taskId: completion.taskId,
        status: completion.status
      }))
    })),
    draws: draws.map((draw) => ({
      id: draw.id,
      entry: draw.entry,
      prizeId: prizes[draw.prize].id,
      result: draw.result,
      previousDrawId:
        draw.previous === undefined ? null : draws[draw.previous].id
    })),
    referrals: referrals.map((referral) => ({
      entry: referral.entry,
      taskId: tasks[referral.task].id,
      code: referral.code
    }))
  };
};
