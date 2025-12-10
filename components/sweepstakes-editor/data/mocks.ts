import { PROVIDER_REQUIRED_SCOPES } from '@/lib/integrations/schemas/providers';
import {
  GiveawayParticipationSchema,
  UserParticipationSchema,
  GiveawayPrizeSchema,
  UserHostRelationshipSchema
} from '@/schemas/giveaway/schemas';
import { AgeVerificationSchema, UserProfileSchema } from '@/schemas/user';
import { IdentityProvider } from '@prisma/client';
import { toast } from 'sonner';

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
      type: IdentityProvider.TWITTER,
      label: 'Preview User',
      link: 'https://x.com/thegiveawaydog',
      scopes: PROVIDER_REQUIRED_SCOPES.TWITTER
    },
    {
      type: IdentityProvider.GOOGLE,
      label: 'preview.user@gmail.com',
      link: 'https://myaccount.google.com/',
      scopes: PROVIDER_REQUIRED_SCOPES.GOOGLE
    },
    {
      type: IdentityProvider.DISCORD,
      label: 'PreviewUser#1234',
      link: 'https://discord.com/channels/@me',
      scopes: PROVIDER_REQUIRED_SCOPES.DISCORD
    },
    {
      type: IdentityProvider.TWITCH,
      label: 'PreviewUser',
      link: 'https://www.twitch.tv/twitch',
      scopes: PROVIDER_REQUIRED_SCOPES.TWITCH
    },
    {
      type: IdentityProvider.KICK,
      label: 'PreviewUser',
      link: 'https://kick.com/kick',
      scopes: PROVIDER_REQUIRED_SCOPES.KICK
    }
  ]
};

export const mockAgeVerification: AgeVerificationSchema = {
  userId: mockUserProfile.id,
  sweepstakesId: 'preview-sweepstake'
};

export const mockParticipation: GiveawayParticipationSchema = {
  totalEntries: 1247,
  usersByTask: {},
  totalUsers: 357
};

export const mockUserParticipation: UserParticipationSchema = {
  entries: 0,
  submissions: [] // First task completed for demo
};

export const mockUserHostRelationship: UserHostRelationshipSchema = {
  loyalty: 5
};

export const mockWinners: GiveawayPrizeSchema[] = [];

export const onFakeLogin = () => {
  toast.success('Login action triggered (not implemented in preview)');
};

export const onFakeTaskComplete = async (
  taskId: string,
  data?: unknown
): Promise<unknown> => {
  toast.success(`Task ${taskId} completed (not implemented in preview)`);
  return Promise.resolve(data);
};

export const onFakeCompleteProfile = () => {
  toast.success(
    'Complete profile action triggered (not implemented in preview)'
  );
};
