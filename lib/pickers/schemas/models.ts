import { z } from 'zod';
import { pickerStatusSchema } from './status';
import { pickerActionsSchema, pickerActionType } from './form';

export const pickerProviderSchema = z.enum(['twitter']);

export type PickerProvider = z.infer<typeof pickerProviderSchema>;

export const pickerSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  name: z.string(),
  provider: pickerProviderSchema,
  status: pickerStatusSchema,
  twitterPostUrl: z.string().url(),
  twitterPostId: z.string(),
  twitterAuthor: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  timeZone: z.string(),
  numberOfWinners: z.number().int().positive(),
  syncStartedAt: z.date().nullable(),
  syncCompletedAt: z.date().nullable(),
  totalEntriesProcessed: z.number().int().nonnegative().default(0),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Picker = z.infer<typeof pickerSchema>;

export const pickerFilterSettingsSchema = z.object({
  pickerId: z.string(),
  minimumPostCount: z.number().int().nonnegative().nullable(),
  minimumAccountAgeDays: z.number().int().nonnegative().nullable(),
  minimumFollowers: z.number().int().nonnegative().nullable(),
  minimumFollowing: z.number().int().nonnegative().nullable(),
  hasProfileImage: z.boolean(),
  hasBanner: z.boolean(),
  hasLocation: z.boolean(),
  hasDescription: z.boolean()
});

export type PickerFilterSettings = z.infer<typeof pickerFilterSettingsSchema>;

export const pickerEntrySchema = z.object({
  id: z.string(),
  pickerId: z.string(),
  userId: z.string().nullable(),
  twitterUserId: z.string(),
  twitterUsername: z.string(),
  twitterDisplayName: z.string(),
  twitterProfileImage: z.string().url().nullable(),
  actionType: pickerActionType,
  timestamp: z.date(),
  filtered: z.boolean(),
  createdAt: z.date()
});

export type PickerEntry = z.infer<typeof pickerEntrySchema>;

export const pickerParticipantSchema = z.object({
  twitterUserId: z.string(),
  twitterUsername: z.string(),
  twitterDisplayName: z.string(),
  twitterProfileImage: z.string().url().nullable(),
  userId: z.string().nullable(),
  verified: z.boolean(),
  isBlacklisted: z.boolean(),
  totalEntries: z.number().int().nonnegative(),
  actions: z.object({
    like: z.number().int().nonnegative(),
    repost: z.number().int().nonnegative(),
    quote: z.number().int().nonnegative(),
    reply: z.number().int().nonnegative()
  })
});

export type PickerParticipant = z.infer<typeof pickerParticipantSchema>;

export const pickerBlacklistSchema = z.object({
  id: z.string(),
  twitterUserId: z.string(),
  twitterUsername: z.string(),
  reason: z.string().optional(),
  createdAt: z.date()
});

export type PickerBlacklist = z.infer<typeof pickerBlacklistSchema>;

export const pickerDrawSchema = z.object({
  id: z.string(),
  pickerId: z.string(),
  drawNumber: z.number().int().positive(),
  drawnAt: z.date(),
  drawnBy: z.string(),
  drawnByUsername: z.string().nullable(),
  filterSettingsSnapshot: pickerFilterSettingsSchema,
  actionsSnapshot: pickerActionsSchema,
  eligibleEntries: z.number().int().nonnegative(),
  verificationHash: z.string()
});

export type PickerDraw = z.infer<typeof pickerDrawSchema>;

export const pickerWinnerSchema = z.object({
  id: z.string(),
  drawId: z.string(),
  pickerId: z.string(),
  userId: z.string().nullable(),
  twitterUserId: z.string(),
  twitterUsername: z.string(),
  twitterDisplayName: z.string(),
  twitterProfileImage: z.string().url().nullable(),
  verified: z.boolean(),
  position: z.number().int().positive(),
  selectedAt: z.date(),
  rerolled: z.boolean().default(false),
  rerolledAt: z.date().nullable(),
  rerollReason: z.string().nullable()
});

export type PickerWinner = z.infer<typeof pickerWinnerSchema>;

export const pickerWithDetailsSchema = pickerSchema.extend({
  actions: pickerActionsSchema,
  filterSettings: pickerFilterSettingsSchema,
  stats: z.object({
    totalEntries: z.number().int().nonnegative(),
    uniqueParticipants: z.number().int().nonnegative(),
    filteredEntries: z.number().int().nonnegative()
  })
});

export type PickerWithDetails = z.infer<typeof pickerWithDetailsSchema>;
