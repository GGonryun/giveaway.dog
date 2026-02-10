import z from 'zod';
import {
  BonusLoyaltyTaskSchema,
  BonusTimedTaskSchema,
  ReferralLinkTaskSchema,
  SecretCodeV2TaskSchema,
  TaskSchema
} from '../schemas';
import { assertNever } from '@/lib/errors';
import {
  BaseGiveawayFormSchema,
  GiveawayFormSchemaOptions
} from '@/schemas/giveaway/schemas';

export type ValidateSweepstakeTaskOptions<T extends TaskSchema = TaskSchema> = {
  task: T;
  form: BaseGiveawayFormSchema;
  index: number;
  maxLoyalty: number;
  ctx: z.RefinementCtx;
};

export type RefineSweepstakesTaskArgs = {
  ctx: z.RefinementCtx;
  form: BaseGiveawayFormSchema;
} & GiveawayFormSchemaOptions;

export const refineSweepstakeTasks = async (
  args: RefineSweepstakesTaskArgs
) => {
  const { form, ctx, maxLoyalty } = args;

  baseValidator(args);

  form.tasks.forEach((task, index) => {
    const options = { maxLoyalty, task, form, index, ctx };

    globalValidator(options);
    typeValidator(options);
  });
};

const globalValidator = (args: ValidateSweepstakeTaskOptions) => {
  const { task, form, index, ctx } = args;

  if (
    task.tasksRequired !== undefined &&
    task.tasksRequired >= form.tasks.length
  ) {
    ctx.addIssue({
      path: ['tasks', index, 'tasksRequired'],
      code: z.ZodIssueCode.too_big,
      maximum: form.tasks.length,
      inclusive: false,
      type: 'number',
      message: `Tasks required cannot exceed total number of tasks (${form.tasks.length})`
    });
  }
};

const typeValidator = (args: ValidateSweepstakeTaskOptions) => {
  const { task } = args;

  switch (task.type) {
    case 'BONUS_TIMED':
      return bonusTimedValidator({ ...args, task });
    case 'BONUS_LOYALTY':
      return bonusLoyaltyValidator({ ...args, task });
    case 'REFERRAL_LINK':
      return referralLinkValidator({ ...args, task });
    case 'SECRET_CODE_V2':
      return secretCodeV2Validator({ ...args, task });
    case 'BONUS_LIMITED':
    case 'BONUS_TASK':
    case 'BONUS_COMPLETE_PROFILE':
    case 'VISIT_URL':
    case 'TWITTER_CONNECT':
    case 'TWITTER_FOLLOW':
    case 'TWITTER_RETWEET':
    case 'TWITTER_RETWEET_IMPORT':
    case 'TWITTER_RETWEET_IMPORT_V2':
    case 'TWITTER_LIKE':
    case 'TWITTER_LIKE_IMPORT':
    case 'STEAM_WISHLIST':
    case 'STEAM_FOLLOW':
    case 'DISCORD_JOIN':
    case 'DISCORD_INTERACTION_IMPORT':
    case 'TWITCH_FOLLOW':
    case 'KICK_FOLLOW':
    case 'SECRET_CODE':
    case 'YOUTUBE_VISIT':
    case 'INSTAGRAM_VISIT':
    case 'INSTAGRAM_LIKE':
    case 'INSTAGRAM_COMMENT':
    case 'FACEBOOK_VISIT_PAGE':
    case 'FACEBOOK_VIEW_POST':
    case 'TIKTOK_FOLLOW':
    case 'TIKTOK_LIKE':
    case 'BLUESKY_CONNECT':
    case 'BLUESKY_FOLLOW':
    case 'BLUESKY_LIKE':
    case 'BLUESKY_REPOST':
    case 'BLUESKY_LIKE_IMPORT':
    case 'BLUESKY_REPOST_IMPORT':
    case 'ASK_QUESTION':
    case 'SINGLE_CHOICE':
    case 'MULTIPLE_CHOICE':
    case 'SUBMIT_MEDIA':
    case 'VELORA_CONNECT':
      // no specific validation needed
      return;
    default:
      throw assertNever(task);
  }
};

const bonusLoyaltyValidator = (
  args: ValidateSweepstakeTaskOptions<BonusLoyaltyTaskSchema>
) => {
  const { task, maxLoyalty, index, ctx } = args;

  if (task.loyaltyRequired > maxLoyalty) {
    ctx.addIssue({
      path: ['tasks', index, 'loyaltyRequired'],
      code: z.ZodIssueCode.too_small,
      minimum: 1,
      inclusive: true,
      type: 'number',
      message: `Loyalty required cannot exceed your total number of published sweepstakes (${maxLoyalty})`
    });
  }
};

const bonusTimedValidator = (
  args: ValidateSweepstakeTaskOptions<BonusTimedTaskSchema>
) => {
  const { task, form, index, ctx } = args;
  if (task.endDate) {
    const endDate = new Date(task.endDate);

    if (endDate < form.timing.startDate) {
      ctx.addIssue({
        path: ['tasks', index, 'endDate'],
        code: z.ZodIssueCode.invalid_date,
        message: 'End date cannot be before sweepstakes start date'
      });
    }

    if (endDate > form.timing.endDate) {
      ctx.addIssue({
        path: ['tasks', index, 'endDate'],
        code: z.ZodIssueCode.invalid_date,
        message: 'End date cannot be after sweepstakes end date'
      });
    }
  }

  if (task.startDate) {
    const startDate = new Date(task.startDate);

    if (startDate < form.timing.startDate) {
      ctx.addIssue({
        path: ['tasks', index, 'startDate'],
        code: z.ZodIssueCode.invalid_date,
        message: 'Start date cannot be before sweepstakes start date'
      });
    }

    if (startDate > form.timing.endDate) {
      ctx.addIssue({
        path: ['tasks', index, 'startDate'],
        code: z.ZodIssueCode.invalid_date,
        message: 'Start date cannot be after sweepstakes end date'
      });
    }
  }

  if (task.startDate && task.endDate) {
    const startDate = new Date(task.startDate);
    const endDate = new Date(task.endDate);

    if (endDate <= startDate) {
      ctx.addIssue({
        path: ['tasks', index, 'endDate'],
        code: z.ZodIssueCode.invalid_date,
        message: 'End date must be after start date'
      });
    }
  }

  if (!task.startDate && !task.endDate) {
    const message =
      'At least one of start date or end date must be set for timed bonus tasks';
    ctx.addIssue({
      path: ['tasks', index, 'startDate'],
      code: z.ZodIssueCode.custom,
      message
    });
    ctx.addIssue({
      path: ['tasks', index, 'endDate'],
      code: z.ZodIssueCode.custom,
      message
    });
  }
};

const referralLinkValidator = (
  args: ValidateSweepstakeTaskOptions<ReferralLinkTaskSchema>
) => {
  const { form, ctx, index } = args;

  const referralTasks = form.tasks.filter((t) => t.type === 'REFERRAL_LINK');

  if (referralTasks.length > 1) {
    ctx.addIssue({
      path: ['tasks', index, 'title'],
      code: z.ZodIssueCode.custom,
      message: 'Only one referral link task is allowed per giveaway'
    });
  }
};

const secretCodeV2Validator = (
  args: ValidateSweepstakeTaskOptions<SecretCodeV2TaskSchema>
) => {
  const { task, index, ctx } = args;

  const hasEmptyCode = task.codes.some((code) => !code || code.trim() === '');

  if (hasEmptyCode) {
    ctx.addIssue({
      path: ['tasks', index, 'codes'],
      code: z.ZodIssueCode.custom,
      message: 'All secret codes must be filled in'
    });
  }
};

const baseValidator = (args: RefineSweepstakesTaskArgs) => {
  const { form, ctx } = args;

  const referralTasks = form.tasks.filter((t) => t.type === 'REFERRAL_LINK');

  if (referralTasks.length > 1) {
    ctx.addIssue({
      path: ['tasks'],
      code: z.ZodIssueCode.custom,
      message: 'Only one referral link task is allowed per giveaway'
    });
  }
};
