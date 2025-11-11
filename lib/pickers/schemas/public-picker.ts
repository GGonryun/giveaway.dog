import {
  PickerJobStatus,
  PickerJobType,
  PickerStatus,
  PickerType,
  Prisma
} from '@prisma/client';
import z from 'zod';
import { auditLogSchema, parsePickerAuditLogs } from './audit-log';
import {
  pickerFormSchema,
  parsePickerFormSchema,
  PickerFormSchema
} from './form';
import { parsePickerDrawsSchema, pickerDrawsSchema } from './draws';
import {
  ActionsTwitterUser,
  EligibleTwitterUser,
  eligibleTwitterUserSchema
} from '@/lib/integrations/schemas/api';
import { fetchTwitterDataSchema, toTwitterData } from './jobs';
import { ApplicationError } from '@/lib/errors';

export const pickerJobSchema = z.object({
  id: z.string(),
  parentId: z.string().nullable(),
  type: z.nativeEnum(PickerJobType),
  status: z.nativeEnum(PickerJobStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
  runAt: z.date().nullable(),
  data: z.any().nullable()
});

export type PickerJobSchema = z.infer<typeof pickerJobSchema>;

export const pickerStatsSchema = z.object({
  totalEntries: z.number(),
  uniqueParticipants: z.number(),
  filteredEntries: z.number(),
  validEntries: z.number()
});

export type PickerStatsSchema = z.infer<typeof pickerStatsSchema>;

export const publicPickerSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(PickerStatus),
  type: z.nativeEnum(PickerType),
  createdAt: z.date(),
  updatedAt: z.date(),
  form: pickerFormSchema({ validateScheduledAt: false }),
  draws: pickerDrawsSchema,
  jobs: z.array(pickerJobSchema),
  logs: z.array(auditLogSchema),
  users: z.array(eligibleTwitterUserSchema),
  stats: pickerStatsSchema
});

export type PublicPickerSchema = z.infer<typeof publicPickerSchema>;

export const PUBLIC_PICKER_INCLUDE = {
  form: {
    select: {
      data: true
    }
  },
  jobs: {
    include: {
      children: true,
      picker: true
    }
  },
  logs: true,
  draws: true
} satisfies Prisma.PickerInclude;

export const toPublicPicker = (
  picker: Prisma.PickerGetPayload<{
    include: typeof PUBLIC_PICKER_INCLUDE;
  }>
): PublicPickerSchema => {
  const form = parsePickerFormSchema(picker.form, { validate: true });
  const data = parseEligiblePickerData(picker, form);
  return {
    id: picker.id,
    status: picker.status,
    type: picker.type,
    createdAt: picker.createdAt,
    updatedAt: picker.updatedAt,
    form,
    logs: parsePickerAuditLogs(picker.logs),
    jobs: parsePickerJobs(picker.jobs),
    users: data.users,
    draws: parsePickerDrawsSchema(picker.draws, data.users),
    stats: parsePickerStats(data)
  };
};

export type TwitterActionsWithEligibility = {
  users: EligibleTwitterUser[];
};

export const parseEligiblePickerData = (
  picker: Prisma.PickerGetPayload<{
    include: typeof PUBLIC_PICKER_INCLUDE;
  }>,
  form: PickerFormSchema
): TwitterActionsWithEligibility => {
  const primary = picker.jobs.find(
    (j) => j.type === PickerJobType.FETCH_TWITTER_DATA
  );
  if (!primary)
    throw new ApplicationError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Primary job not found',
      data: picker
    });

  if (!primary.data) {
    return {
      users: []
    };
  }

  const parsed = fetchTwitterDataSchema.safeParse(primary.data);
  if (!parsed.success) {
    throw new ApplicationError({
      code: 'VALIDATION_ERROR',
      message: 'Failed to parse primary job data',
      data: parsed.error
    });
  }

  const fetched = toTwitterData(primary);

  return {
    users: fetched.users.map((user) => ({
      ...user,
      ineligible: getDisqualificationReason(user, form)
    }))
  };
};

export const getDisqualificationReason = (
  user: ActionsTwitterUser,
  form: PickerFormSchema
): string | undefined => {
  const missingActions = getMissingActions(user, form);
  if (missingActions.length > 0)
    return `Missing required actions: ${missingActions.join(', ')}`;

  if (
    (user.public_metrics?.tweet_count ?? 0) <
    (form.filters.minimumPostCount ?? 0)
  ) {
    return `User has insufficient post count (${user.public_metrics?.tweet_count ?? 0}/${form.filters.minimumPostCount})`;
  }

  if (
    (user.public_metrics?.followers_count ?? 0) <
    (form.filters.minimumFollowers ?? 0)
  ) {
    return `User has insufficient followers (${user.public_metrics?.followers_count ?? 0}/${form.filters.minimumFollowers})`;
  }

  if (
    (user.public_metrics?.following_count ?? 0) <
    (form.filters.minimumFollowing ?? 0)
  ) {
    return `User has insufficient following (${user.public_metrics?.following_count ?? 0}/${form.filters.minimumFollowing})`;
  }

  if (form.filters.minimumAccountAgeDays && user.created_at) {
    const accountAgeDays =
      (Date.now() - new Date(user.created_at).getTime()) /
      (1000 * 60 * 60 * 24);
    if (accountAgeDays < form.filters.minimumAccountAgeDays) {
      return `Account is too new (${Math.floor(accountAgeDays)}/${form.filters.minimumAccountAgeDays} days)`;
    }
  }

  if (!user.profile_banner_url && form.requirements.hasBanner) {
    return `User is missing a profile banner`;
  }

  if (!user.profile_image_url && form.requirements.hasProfileImage) {
    return `User is missing a profile image`;
  }

  if (!user.location && form.requirements.hasLocation) {
    return `User is missing a location`;
  }

  if (!user.description && form.requirements.hasDescription) {
    return `User is missing a description`;
  }

  return undefined;
};

export const getMissingActions = (
  user: ActionsTwitterUser,
  form: PickerFormSchema
) => {
  const requiredActions: ActionsTwitterUser['actions'] = [];
  if (form.actions.like) requiredActions.push('like');
  if (form.actions.repost) requiredActions.push('retweet');
  if (form.actions.quote) requiredActions.push('quote');
  if (form.actions.reply) requiredActions.push('reply');

  const missingActions = requiredActions.filter(
    (action) => !user.actions.includes(action)
  );

  return missingActions;
};

export const parsePickerStats = (
  data: TwitterActionsWithEligibility
): PickerStatsSchema => {
  const validUsers = data.users.filter((user) => !user.ineligible);

  return {
    totalEntries: data.users.reduce((sum, user) => {
      const actionsCount = user.actions.length;
      return sum + actionsCount;
    }, 0),
    uniqueParticipants: data.users.length,
    filteredEntries: data.users.length - validUsers.length,
    validEntries: validUsers.length
  };
};

export const parsePickerJobs = (
  jobs: Prisma.PickerJobGetPayload<{
    include: { children: true; picker: true };
  }>[]
): PickerJobSchema[] => {
  return jobs.map((job) => ({
    id: job.id,
    parentId: job.parentId,
    type: job.type,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    runAt: job.runAt,
    data: job.data
  }));
};
