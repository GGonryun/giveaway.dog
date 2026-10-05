import z from 'zod';

export const timingSchema = ({
  validate,
  maxDurationDays
}: {
  validate: boolean;
  maxDurationDays: number;
}) => {
  const endDate = validate
    ? z.coerce.date().refine((date) => date > new Date(), {
        message: 'End date must be in the future'
      })
    : z.coerce.date();
  const obj = z.object({
    startDate: z.coerce.date(),
    endDate,
    timeZone: z.string()
  });
  if (!validate) return obj;
  return obj.superRefine((data, ctx) => {
    const startDate = data.startDate;
    const endDate = data.endDate;
    if (startDate && endDate <= startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be after start date',
        path: ['endDate']
      });
    }
    // do not allow giveaways longer than 30 days
    const maxEndDate = new Date(startDate);
    maxEndDate.setDate(maxEndDate.getDate() + maxDurationDays);
    if (endDate > maxEndDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duration cannot exceed ${maxDurationDays} days`,
        path: ['endDate']
      });
    }
  });
};

export type TimingSchema = z.infer<ReturnType<typeof timingSchema>>;
