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
  source: 'SIGNUP',
  qualityScore: 85,
  providers: [
    {
      type: 'twitter',
      label: 'Preview User',
      link: 'https://x.com/thegiveawaydog',
      scopes: PROVIDER_REQUIRED_SCOPES.twitter
    },
    {
      type: 'google',
      label: 'preview.user@gmail.com',
      link: 'https://myaccount.google.com/',
      scopes: PROVIDER_REQUIRED_SCOPES.google
    },
    {
      type: 'discord',
      label: 'PreviewUser#1234',
      link: 'https://discord.com/channels/@me',
      scopes: PROVIDER_REQUIRED_SCOPES.discord
    },
    {
      type: 'twitch',
      label: 'PreviewUser',
      link: 'https://www.twitch.tv/twitch',
      scopes: PROVIDER_REQUIRED_SCOPES.twitch
    },
    {
      type: 'kick',
      label: 'PreviewUser',
      link: 'https://kick.com/kick',
      scopes: PROVIDER_REQUIRED_SCOPES.kick
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
