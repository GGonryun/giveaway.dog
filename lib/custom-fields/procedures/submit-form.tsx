'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError, assertNever } from '@/lib/errors';
import {
  Account,
  PrismaClient,
  SweepstakesFormFieldType,
  Prisma
} from '@prisma/client';
import { extractUsernameFromProfileUrl } from '@/lib/integrations/schemas/twitter';
import z from 'zod';
import { toTaskSchema } from '@/lib/task/schemas';

type ValidationContext = {
  db: PrismaClient;
  fieldId: string;
  value: string;
  participantId: string;
  sweepstakesId: string;
  userAccounts: Account[];
  userEmail?: string | null;
};

const validateEmailField = async (ctx: ValidationContext) => {
  const { value, userAccounts, fieldId, participantId, sweepstakesId, db } =
    ctx;

  // Check if this email belongs to ANY user in the system
  const userWithEmail = await db.user.findFirst({
    where: {
      email: {
        equals: value,
        mode: 'insensitive'
      }
    }
  });

  // If a user exists with this email, verify it's the current user
  if (userWithEmail) {
    const currentUserId = userAccounts[0]?.userId;

    if (!currentUserId) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An entry with this email already exists.'
      });
    }

    if (userWithEmail.id !== currentUserId) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: `This email address belongs to another user. You can only use your own email address.`
      });
    }
  }

  // Check for uniqueness across all participants in this sweepstakes
  const existingValue = await db.sweepstakesFormValue.findFirst({
    where: {
      fieldId,
      value,
      participant: {
        sweepstakesId
      },
      participantId: {
        not: participantId
      }
    }
  });

  if (existingValue) {
    throw new ApplicationError({
      code: 'CONFLICT',
      message: 'This email address has already been used in this sweepstakes'
    });
  }
};

const validateTwitterField = async (ctx: ValidationContext) => {
  const { value, userAccounts, fieldId, participantId, sweepstakesId, db } =
    ctx;

  // If the field isn't required and no value is provided, skip validation
  if (!value || value.trim() === '') {
    return;
  }

  // Extract username from the submitted URL
  const submittedUsername = extractUsernameFromProfileUrl(value);

  if (!submittedUsername) {
    throw new ApplicationError({
      code: 'BAD_REQUEST',
      message:
        'Invalid Twitter profile URL format. Please use https://x.com/username'
    });
  }

  // Check if this Twitter username belongs to ANY connected account in the system
  const accountWithUsername = await db.account.findFirst({
    where: {
      provider: 'twitter',
      OR: [
        { label: { equals: submittedUsername, mode: 'insensitive' } },
        { link: { equals: value, mode: 'insensitive' } }
      ]
    },
    include: {
      user: true
    }
  });

  // If an account exists with this username, verify it belongs to the current user
  if (accountWithUsername) {
    const accountOwnerId = accountWithUsername.userId;
    const currentUserId = userAccounts[0]?.userId;

    if (!currentUserId) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An entry with this profile already exists.'
      });
    }

    if (accountOwnerId !== currentUserId) {
      throw new ApplicationError({
        code: 'FORBIDDEN',
        message: `This Twitter profile (@${submittedUsername}) belongs to another user. You can only use your own connected accounts.`
      });
    }
  }

  // Normalize Twitter URL for comparison
  const normalizedValue = value.toLowerCase().trim();

  // Check for uniqueness across all participants in this sweepstakes
  const existingValues = await db.sweepstakesFormValue.findMany({
    where: {
      fieldId,
      participant: {
        sweepstakesId
      },
      participantId: {
        not: participantId
      }
    }
  });

  // Check if any existing value matches (case-insensitive)
  const isDuplicate = existingValues.some(
    (v) => v.value.toLowerCase().trim() === normalizedValue
  );

  if (isDuplicate) {
    throw new ApplicationError({
      code: 'CONFLICT',
      message: 'This Twitter profile has already been used in this sweepstakes'
    });
  }
};

type ValidateUniqueFieldsParams = {
  db: PrismaClient;
  data: Record<string, string | boolean>;
  formFields: Array<{
    id: string;
    type: SweepstakesFormFieldType | null;
  }>;
  participantId: string;
  sweepstakesId: string;
  userAccounts: Account[];
  userEmail?: string | null;
};

const validateUniqueFields = async (params: ValidateUniqueFieldsParams) => {
  const {
    db,
    data,
    formFields,
    participantId,
    sweepstakesId,
    userAccounts,
    userEmail
  } = params;

  for (const [fieldId, value] of Object.entries(data)) {
    const field = formFields.find((f) => f.id === fieldId);

    if (!field) {
      throw new ApplicationError({
        code: 'BAD_REQUEST',
        message: `Invalid field ID: ${fieldId}`
      });
    }

    // Convert value to string for storage
    const stringValue = typeof value === 'boolean' ? String(value) : value;

    // Perform validation based on field type
    if (!field.type) {
      throw new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR',
        message:
          'Something went wrong! Please try again later or contact support if the issue persists.',
        cause: `Field type is missing for field ID: ${fieldId}`
      });
    }

    switch (field.type) {
      case SweepstakesFormFieldType.EMAIL: {
        await validateEmailField({
          db,
          fieldId,
          value: stringValue,
          participantId,
          sweepstakesId,
          userAccounts,
          userEmail
        });
        break;
      }

      case SweepstakesFormFieldType.TWITTER: {
        await validateTwitterField({
          db,
          fieldId,
          value: stringValue,
          participantId,
          sweepstakesId,
          userAccounts,
          userEmail
        });
        break;
      }

      case SweepstakesFormFieldType.USERNAME:
      case SweepstakesFormFieldType.AGE:
        // No validation required for these types
        break;

      default:
        assertNever(field.type);
    }
  }
};

export const submitParticipantForm = procedure()
  .authorization({ required: true })
  .input(
    z.object({
      sweepstakesId: z.string(),
      data: z.record(z.string(), z.union([z.string(), z.boolean()]))
    })
  )
  .output(
    z.object({
      success: z.boolean()
    })
  )
  .handler(async ({ db, user, input: { sweepstakesId, data } }) => {
    // Get the participant record
    const participant = await db.sweepstakesParticipant.findUnique({
      where: {
        userId_sweepstakesId: {
          userId: user.id,
          sweepstakesId
        }
      }
    });

    if (!participant) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Participant record not found'
      });
    }

    // Fetch all form fields for this sweepstakes
    const sweepstakes = await db.sweepstakes.findUnique({
      where: { id: sweepstakesId },
      include: {
        audience: {
          include: {
            formFields: true
          }
        }
      }
    });

    if (!sweepstakes?.audience) {
      throw new ApplicationError({
        code: 'NOT_FOUND',
        message: 'Sweepstakes not found'
      });
    }

    const formFields = sweepstakes.audience.formFields;

    // Fetch user's connected accounts for verification
    const userAccounts = await db.account.findMany({
      where: {
        userId: user.id
      }
    });

    // Validate each field and check for uniqueness constraints
    await validateUniqueFields({
      db,
      data,
      formFields,
      participantId: participant.id,
      sweepstakesId,
      userAccounts,
      userEmail: user.email
    });

    // Create or update form values
    await db.$transaction(async (tx) => {
      for (const [fieldId, value] of Object.entries(data)) {
        const stringValue = typeof value === 'boolean' ? String(value) : value;

        await tx.sweepstakesFormValue.upsert({
          where: {
            participantId_fieldId: {
              participantId: participant.id,
              fieldId
            }
          },
          create: {
            participantId: participant.id,
            fieldId,
            value: stringValue
          },
          update: {
            value: stringValue
          }
        });
      }

      // Auto-complete BONUS_COMPLETE_PROFILE task if it exists
      const allTasks = await tx.task.findMany({
        where: {
          sweepstakesId
        }
      });

      // Find the BONUS_COMPLETE_PROFILE task by parsing its config
      const profileCompletionTask = allTasks.find((task) => {
        try {
          const taskConfig = toTaskSchema(task);
          return taskConfig.type === 'BONUS_COMPLETE_PROFILE';
        } catch {
          return false;
        }
      });

      if (profileCompletionTask) {
        // Check if already completed
        const existingCompletion = await tx.taskCompletion.findFirst({
          where: {
            participantId: participant.id,
            taskId: profileCompletionTask.id
          }
        });

        // Only create if not already completed
        if (!existingCompletion) {
          await tx.taskCompletion.create({
            data: {
              participantId: participant.id,
              taskId: profileCompletionTask.id,
              status: 'COMPLETED',
              proof: Prisma.JsonNull
            }
          });
        }
      }
    });

    return { success: true };
  });
