import { z } from 'zod';
import { isValidEmail } from '@/lib/email-validation';

export const emailSubscriptionSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .refine((email) => isValidEmail(email), {
      message: 'Please use a valid email address'
    })
});

export type EmailSubscriptionInput = z.infer<typeof emailSubscriptionSchema>;
