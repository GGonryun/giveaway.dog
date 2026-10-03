import { ApplicationError } from '@giveaway/util-errors';
import {
  BonusCompleteProfileTaskSchema,
  BonusLimitedTaskSchema,
  BonusLoyaltyTaskSchema,
  BonusTimedTaskSchema
} from '../schemas';
import { PrismaClient } from '@prisma/client';
import { ValidateTaskInput } from './types';
import { getLoyalty } from '@/lib/loyalty/db';
import { isLoyal } from '@/lib/loyalty/validation';
import {
  isProfileComplete,
  toParticipantFormFields
} from '@/schemas/giveaway/participant';
import { toUserSchema, USER_SCHEMA_SELECT_QUERY } from '@/schemas/user';

export const checkBonusTimed = async (task: BonusTimedTaskSchema) => {
  // check to see if the current time is within the task's time window
  const now = new Date();
  if (task.startDate) {
    const startDate = new Date(task.startDate);
    if (now < startDate) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'This bonus timed task is not active yet.'
      });
    }
  }
  if (task.endDate) {
    const endDate = new Date(task.endDate);
    if (now > endDate) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: 'This bonus timed task has expired.'
      });
    }
  }
};

export const checkBonusLimited = async (
  db: PrismaClient,
  { task }: { task: BonusLimitedTaskSchema }
) => {
  // check to see if the current number of entrants is below the maxEntrants
  const max = task.maxEntrants;
  const current = await db.taskCompletion.count({
    where: { taskId: task.id }
  });

  if (current >= max) {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message:
        'This bonus limited task has reached its maximum number of entrants.'
    });
  }

  return;
};

export const checkBonusLoyalty = async (
  db: PrismaClient,
  input: ValidateTaskInput<BonusLoyaltyTaskSchema>
) => {
  console.info(
    `Checking loyalty requirements for bonus loyalty task ${input.task.id} for user ${input.userId}`
  );
  // we need to figure out who the team is, and then find every task completion
  // owned by the user for sweepstakes owned by that team
  const loyalty = await getLoyalty(db, input);
  console.info(
    `Checking loyalty requirements for bonus loyalty task ${input.task.id} for user ${input.userId}`
  );

  console.info(
    `User ${input.userId} has loyalty ${loyalty} for bonus loyalty task ${input.task.id}`
  );

  if (isLoyal(loyalty, input.task)) {
    console.info(
      `Bonus loyalty task ${input.task.id} validation passed for user ${input.userId}`
    );

    return;
  }

  throw new ApplicationError({
    code: 'FORBIDDEN',
    message: `You need at least ${input.task.loyaltyRequired} loyalty to complete this tier.`,
    data: {
      userLoyalty: loyalty,
      requiredLoyalty: input.task.loyaltyRequired
    }
  });
};

export const checkBonusCompleteProfile = async (
  db: PrismaClient,
  input: ValidateTaskInput<BonusCompleteProfileTaskSchema>
) => {
  console.info(
    `Checking profile completion for bonus complete profile task ${input.task.id} for user ${input.userId}`
  );

  // Fetch the sweepstakes with its form fields
  const sweepstakes = await db.sweepstakes.findFirst({
    where: {
      tasks: { some: { id: input.task.id } }
    },
    select: {
      tasks: {
        where: { id: input.task.id },
        select: { sweepstakesId: true }
      },
      audience: {
        select: {
          formFields: true
        }
      }
    }
  });

  if (!sweepstakes?.audience?.formFields || !sweepstakes.tasks[0]) {
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unable to verify profile completion requirements'
    });
  }

  const sweepstakesId = sweepstakes.tasks[0].sweepstakesId;

  // Fetch user with all profile data
  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: USER_SCHEMA_SELECT_QUERY
  });

  if (!user) {
    throw new ApplicationError({
      code: 'NOT_FOUND',
      message: 'User not found'
    });
  }

  // Fetch participant's form values
  const participant = await db.sweepstakesParticipant.findUnique({
    where: {
      userId_sweepstakesId: {
        userId: input.userId,
        sweepstakesId
      }
    },
    include: {
      formValues: true
    }
  });

  // Convert form values to a map
  const formValuesMap =
    participant?.formValues.reduce<Record<string, string>>((acc, fv) => {
      acc[fv.fieldId] = fv.value;
      return acc;
    }, {}) || {};

  // Check if profile is complete
  const participantFormFields = toParticipantFormFields(
    sweepstakes.audience.formFields
  );
  const userSchema = toUserSchema(user);

  const profileComplete = isProfileComplete(
    participantFormFields,
    userSchema,
    formValuesMap
  );

  if (!profileComplete) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Please complete your profile before claiming this bonus.'
    });
  }

  console.info(
    `Profile completion check passed for user ${input.userId} on task ${input.task.id}`
  );
};
