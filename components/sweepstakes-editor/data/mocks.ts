import { SAMPLE_SWEEPSTAKES_DATA } from '@/components/demo/sample-sweepstakes-data';
import { PROVIDER_REQUIRED_SCOPES } from '@/lib/integrations/schemas/providers';
import { UserHostRelationshipSchema } from '@/lib/loyalty/schemas';
import { TWITTER_PROFILE_URL } from '@/lib/settings';
import { SweepstakesParticipantSchema } from '@/lib/participant/schemas';
import {
  GiveawayParticipationSchema,
  UserParticipationSchema,
  GiveawayPrizeSchema,
  GiveawayHostSchema
} from '@/schemas/giveaway/schemas';
import { UserSchema } from '@/schemas/user';
import { IdentityProvider } from '@prisma/client';
import { toast } from 'sonner';

export const mockHost: GiveawayHostSchema = {
  id: 'giveaway-dog-id',
  slug: 'giveaway-dog',
  name: 'Giveaway Dog',
  logo: '/taki.png',
  links: [
    {
      platform: 'twitter',
      url: TWITTER_PROFILE_URL
    },
    {
      platform: 'discord',
      url: 'https://discord.gg/giveawaydog'
    }
  ]
};

// Mock user data for preview
export const mockUserProfile: UserSchema = {
  id: 'preview-user',
  name: 'Preview User',
  email: 'user@example.com',
  birthday: new Date('1900-00-00'),
  emailVerified: true,
  image: null,
  countryCode: 'US',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  source: 'SIGNUP',
  createdAt: new Date('2023-01-15T10:00:00Z'),
  qualityScore: 85,
  isAnonymous: false,
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
    },
    {
      type: IdentityProvider.TIKTOK,
      label: 'PreviewUser',
      link: 'https://www.tiktok.com/@previewuser',
      scopes: PROVIDER_REQUIRED_SCOPES.TIKTOK
    }
  ]
};

export const mockParticipation: GiveawayParticipationSchema = {
  totalEntries: 2147,
  usersByTask: {},
  totalUsers: 357
};

export const mockUserParticipation: UserParticipationSchema = {
  entries: 0,
  submissions: [] // First task completed for demo
};

export const mockParticipant: SweepstakesParticipantSchema = {
  id: 'preview-participant',
  user: mockUserProfile,
  completions: [],
  formValues: {}
};

export const mockUserHostRelationship: UserHostRelationshipSchema = {
  loyalty: 5
};

export const mockWinners: GiveawayPrizeSchema[] = [];

export const mockSweepstakes = {
  id: 'preview-sweepstake',
  status: 'RUNNING' as const,
  ...SAMPLE_SWEEPSTAKES_DATA
};

export const mockPrizes = SAMPLE_SWEEPSTAKES_DATA.prizes.map((p) => ({
  prizeId: p.id,
  prizeName: p.name,
  quota: p.quota,
  draws: []
}));

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

export const onFakeFormSubmit = (_: unknown): Promise<unknown> => {
  toast.success('Form submitted (not implemented in preview)');
  return Promise.resolve();
};
