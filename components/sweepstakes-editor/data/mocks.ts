import { PROVIDER_REQUIRED_SCOPES } from '@/lib/integrations/schemas/providers';
import {
  GiveawayParticipationSchema,
  UserParticipationSchema,
  GiveawayPrizeSchema
} from '@/schemas/giveaway/schemas';
import { AgeVerificationSchema, UserProfileSchema } from '@/schemas/user';

export const mockHost = {
  id: 'preview-host-id',
  slug: 'preview-host',
  name: 'Preview Host',
  avatar: '🐶',
  links: []
};

// Mock user data for preview
export const mockUserProfile: UserProfileSchema = {
  id: 'preview-user',
  name: 'Preview User',
  email: 'user@example.com',
  emailVerified: true,
  emoji: '🐶',
  countryCode: 'US',
  qualityScore: 85,
  providers: [
    {
      type: 'twitter',
      label: 'Preview User',
      scopes: PROVIDER_REQUIRED_SCOPES.twitter
    },
    {
      type: 'google',
      label: 'preview.user@gmail.com',
      scopes: PROVIDER_REQUIRED_SCOPES.google
    },
    {
      type: 'discord',
      label: 'PreviewUser#1234',
      scopes: PROVIDER_REQUIRED_SCOPES.discord
    },
    {
      type: 'twitch',
      label: 'PreviewUser',
      scopes: PROVIDER_REQUIRED_SCOPES.twitch
    }
  ]
};

export const mockAgeVerification: AgeVerificationSchema = {
  userId: mockUserProfile.id,
  sweepstakesId: 'preview-sweepstake'
};

export const mockParticipation: GiveawayParticipationSchema = {
  totalEntries: 1247,
  totalUsers: 357
};

export const mockUserParticipation: UserParticipationSchema = {
  entries: 0,
  completedTasks: [] // First task completed for demo
};

export const mockWinners: GiveawayPrizeSchema[] = [];
