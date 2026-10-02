'use server';

import { procedure } from '@/lib/mrpc/procedures';
import { ApplicationError } from '@/lib/errors';
import { isValidEmail } from '@/lib/email-validation';
import { emailSubscriptionSchema } from '@/schemas/email-subscription';
import z from 'zod';

const subscribeEmail = procedure()
  .authorization({ required: false })
  .input(emailSubscriptionSchema)
  .output(
    z.object({
      success: z.boolean()
    })
  )
  .handler(async ({ db, input }) => {
    if (!isValidEmail(input.email)) {
      throw new ApplicationError({
        code: 'UNPROCESSABLE_CONTENT',
        message: 'Please provide a valid email address'
      });
    }

    await db.emailSubscription.upsert({
      where: {
        email: input.email.trim().toLowerCase()
      },
      create: {
        email: input.email.trim().toLowerCase()
      },
      update: {}
    });

    return { success: true };
  });

export default subscribeEmail;
