import 'server-only';

import { nanoid } from 'nanoid';
import {
  PrismaClient,
  SweepstakesJobStatus,
  SweepstakesJobType,
  SweepstakesStatus,
  TeamRole,
  VisibilityType
} from '@giveaway/db-model';
import { toE2eGiveawayName } from '@giveaway/e2e-model/naming';
import {
  E2E_PRESET_STATUS,
  E2eSweepstakesRequest,
  toE2eSweepstakesTiming
} from '@giveaway/e2e-model/requests';
import { applySweepstakesChanges } from '@giveaway/sweepstakes-access/shared';
import { toNewSweepstakesData } from '@giveaway/sweepstakes-editor-server/lifecycle';
import { FORM_SWEEPSTAKES_PAYLOAD } from '@giveaway/sweepstakes-model/db';
import { toSweepstakesInput } from '@giveaway/sweepstakes-model/input';
import { ApplicationError } from '@giveaway/util-errors';
import { expireE2eSweepstakesTags } from './cache';
import { E2eTeam, findE2eTeam } from './ownership';

const E2E_TIME_ZONE = 'UTC';

export const E2E_GIVEAWAY_BANNER = '/images/demo-sweepstakes-banner-2.jpg';

type SessionUser = Parameters<typeof applySweepstakesChanges>[0]['user'];

const toSessionUser = (
  user: E2eTeam['members'][number]['user']
): SessionUser => {
  const session = {
    id: user.id,
    name: user.name ?? '',
    email: user.email,
    image: user.image ?? '',
    username: user.username ?? '',
    onboarded: user.onboarded,
    accountType: user.accountType
  };
  return session;
};

const findOwner = (team: E2eTeam) => {
  const owner = team.members.find((member) => member.role === TeamRole.OWNER);
  if (!owner) {
    throw new ApplicationError({
      code: 'PRECONDITION_FAILED',
      message: `Team ${team.slug} has no owner`
    });
  }
  return owner.user;
};

const assertSlugIsFree = async (db: PrismaClient, slug: string | undefined) => {
  if (!slug) return;
  const taken = await db.sweepstakesVisibility.findUnique({
    where: { slug },
    select: { id: true }
  });
  if (taken) {
    throw new ApplicationError({
      code: 'CONFLICT',
      message: `The giveaway slug ${slug} is already taken`
    });
  }
};

const markCompleted = async (db: PrismaClient, id: string, now: Date) => {
  await db.$transaction([
    db.sweepstakes.update({
      where: { id },
      data: { status: SweepstakesStatus.COMPLETED }
    }),
    db.sweepstakesJob.upsert({
      where: {
        sweepstakesId_type: {
          sweepstakesId: id,
          type: SweepstakesJobType.PROCESS_COMPLETION
        }
      },
      update: { runAt: now },
      create: {
        sweepstakesId: id,
        type: SweepstakesJobType.PROCESS_COMPLETION,
        status: SweepstakesJobStatus.PENDING,
        runAt: now
      }
    })
  ]);
};

export const seedE2eSweepstakes = async ({
  db,
  request,
  now,
  allowPublic
}: {
  db: PrismaClient;
  request: E2eSweepstakesRequest;
  now: Date;
  allowPublic: boolean;
}) => {
  const isPublic = request.visibility === VisibilityType.PUBLIC;
  if (isPublic && !allowPublic) {
    throw new ApplicationError({
      code: 'FORBIDDEN',
      message: 'A PUBLIC giveaway needs E2E_ALLOW_PUBLIC=1'
    });
  }

  const team = await findE2eTeam(db, request.team);
  const owner = findOwner(team);
  await assertSlugIsFree(db, request.slug);

  const { id } = await db.sweepstakes.create({
    data: toNewSweepstakesData({
      teamId: team.id,
      teamName: team.name,
      timezone: E2E_TIME_ZONE
    }),
    select: { id: true }
  });

  const form = await db.sweepstakes.findUniqueOrThrow({
    where: { id },
    include: FORM_SWEEPSTAKES_PAYLOAD
  });
  const input = toSweepstakesInput(form);
  const timing = toE2eSweepstakesTiming(request, now);
  const status = E2E_PRESET_STATUS[request.preset];
  const name = toE2eGiveawayName(request.ns, request.name);
  const tasks = request.tasks.map((task) => ({ ...task, id: nanoid() }));
  const prizes = request.prizes.map((prize) => ({ ...prize, id: nanoid() }));

  await applySweepstakesChanges({
    db,
    user: toSessionUser(owner),
    input: {
      ...input,
      id,
      setup: {
        ...input.setup,
        name,
        banner: E2E_GIVEAWAY_BANNER,
        ...(request.description !== undefined && {
          description: request.description
        })
      },
      timing: { ...timing, timeZone: E2E_TIME_ZONE },
      tasks,
      prizes,
      visibility: {
        visibility: request.visibility,
        slug: request.slug ?? null
      },
      status:
        status === SweepstakesStatus.COMPLETED
          ? SweepstakesStatus.ACTIVE
          : status
    }
  });

  if (status === SweepstakesStatus.COMPLETED) {
    await markCompleted(db, id, now);
  }

  expireE2eSweepstakesTags([id], { lists: isPublic });

  return {
    id,
    name,
    status,
    preset: request.preset,
    team: team.slug,
    owner: owner.email,
    visibility: request.visibility,
    slug: request.slug ?? null,
    ...timing,
    tasks,
    prizes
  };
};
