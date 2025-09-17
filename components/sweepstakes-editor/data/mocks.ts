import {
  GiveawayParticipationSchema,
  UserParticipationSchema,
  GiveawayWinnerSchema
} from '@/schemas/giveaway/schemas';
import { UserProfileSchema } from '@/schemas/user';

export const mockHost = {
  id: 'preview-host-id',
  slug: 'preview-host',
  name: 'Preview Host',
  avatar: '🐶' // Fallback to giveaway dog emoji
};

// Mock user data for preview
export const mockUserProfile: UserProfileSchema = {
  id: 'preview-user',
  name: 'Preview User',
  email: 'user@example.com',
  emailVerified: true,
  emoji: '🐶',
  region: 'US',
  age: 25,
  providers: ['twitter', 'google']
};

export const mockParticipation: GiveawayParticipationSchema = {
  totalEntries: 1247,
  totalUsers: 357
};

export const mockUserParticipation: UserParticipationSchema = {
  entries: 0,
  completedTasks: [] // First task completed for demo
};

export const mockWinners: GiveawayWinnerSchema[] = [];
