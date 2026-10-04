import { SAMPLE_SWEEPSTAKES_DATA } from '@/components/demo/sample-sweepstakes-data';
import { PROVIDER_REQUIRED_SCOPES } from '@giveaway/integration-model/providers';
import { UserHostRelationshipSchema } from '@giveaway/loyalty-model/schemas';
import { TWITTER_PROFILE_URL } from '@giveaway/app-config/settings';
import { SweepstakesParticipantSchema } from '@giveaway/participant-model/schemas';
import {
  GiveawayParticipationSchema,
  UserParticipationSchema,
  GiveawayPrizeSchema,
  GiveawayHostSchema,
  SweepstakesAllocationSchema
} from '@giveaway/sweepstakes-model/schemas';
import { UserSchema } from '@giveaway/user-model/user';
import { IdentityProvider } from '@prisma/client';
import { toast } from 'sonner';
import {
  CreateReferralSchema,
  UserReferralSchema
} from '@giveaway/referrals-model/schemas';

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
  preferredContactMethod: null,
  providers: [
    {
      type: IdentityProvider.TWITTER,
      status: 'ACTIVE',
      label: 'preview_user',
      link: 'https://x.com/thegiveawaydog',
      scopes: PROVIDER_REQUIRED_SCOPES.TWITTER
    },
    {
      type: IdentityProvider.BLUESKY,
      status: 'ACTIVE',
      label: 'giveawaydog.bsky.social',
      scopes: PROVIDER_REQUIRED_SCOPES.BLUESKY
    },
    {
      type: IdentityProvider.GOOGLE,
      status: 'ACTIVE',
      label: 'preview.user@gmail.com',
      link: 'https://myaccount.google.com/',
      scopes: PROVIDER_REQUIRED_SCOPES.GOOGLE
    },
    {
      type: IdentityProvider.DISCORD,
      status: 'ACTIVE',
      label: 'PreviewUser#1234',
      link: 'https://discord.com/channels/@me',
      scopes: PROVIDER_REQUIRED_SCOPES.DISCORD
    },
    {
      type: IdentityProvider.TWITCH,
      status: 'ACTIVE',
      label: 'PreviewUser',
      link: 'https://www.twitch.tv/twitch',
      scopes: PROVIDER_REQUIRED_SCOPES.TWITCH
    },
    {
      type: IdentityProvider.KICK,
      status: 'ACTIVE',
      label: 'PreviewUser',
      link: 'https://kick.com/kick',
      scopes: PROVIDER_REQUIRED_SCOPES.KICK
    },
    {
      type: IdentityProvider.TIKTOK,
      status: 'ACTIVE',
      label: 'PreviewUser',
      link: 'https://www.tiktok.com/@previewuser',
      scopes: PROVIDER_REQUIRED_SCOPES.TIKTOK
    },
    {
      type: IdentityProvider.STEAM,
      status: 'ACTIVE',
      label: 'PreviewUser',
      link: 'https://store.steampowered.com/',
      scopes: PROVIDER_REQUIRED_SCOPES.STEAM
    },
    {
      type: IdentityProvider.INSTAGRAM,
      status: 'ACTIVE',
      label: 'preview.user',
      link: 'https://www.instagram.com/preview.user/',
      scopes: PROVIDER_REQUIRED_SCOPES.INSTAGRAM
    },
    {
      type: IdentityProvider.FACEBOOK,
      status: 'ACTIVE',
      label: 'Preview User',
      link: 'https://www.facebook.com/preview.user',
      scopes: PROVIDER_REQUIRED_SCOPES.FACEBOOK
    },
    {
      type: IdentityProvider.VELORA,
      status: 'ACTIVE',
      label: 'PreviewUser',
      link: 'https://velora.tv/previewuser',
      scopes: PROVIDER_REQUIRED_SCOPES.VELORA
    },
    {
      type: IdentityProvider.LINKEDIN,
      status: 'ACTIVE',
      label: 'Preview User',
      link: 'https://www.linkedin.com/in/previewuser/',
      scopes: PROVIDER_REQUIRED_SCOPES.LINKEDIN
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
  allocation: null,
  completions: [],
  formValues: {}
};

export const mockUserHostRelationship: UserHostRelationshipSchema = {
  loyalty: 5
};

export const mockUserReferral: UserReferralSchema = {
  id: 'preview-referral',
  code: 'PREVIEW123',
  link: `${process.env.NEXT_PUBLIC_APP_URL}/referral/PREVIEW123`,
  referrals: [
    {
      user: {
        id: 'preview-user',
        name: 'Giveaway Dog'
      },
      createdAt: new Date('1994-10-21T10:00:00Z')
    }
  ]
};

export const mockAllocation = (
  prizes: GiveawayPrizeSchema[]
): SweepstakesAllocationSchema | undefined => {
  const [primary] = prizes;
  if (!primary) {
    return undefined;
  }

  return {
    prize: {
      id: primary.prizeId,
      name: primary.prizeName
    }
  };
};

export const onFakeAllocate = async (
  allocation: Pick<SweepstakesAllocationSchema, 'prize'>
): Promise<unknown> => {
  toast.success(
    `Allocate action for prize ${allocation.prize.name} triggered (not implemented in preview)`
  );
  return Promise.resolve();
};

export const mockWinners: GiveawayPrizeSchema[] = [];

export const mockSweepstakes = {
  id: 'preview-sweepstake',
  status: 'RUNNING' as const,
  ...SAMPLE_SWEEPSTAKES_DATA
};

export const mockPrizes: GiveawayPrizeSchema[] =
  SAMPLE_SWEEPSTAKES_DATA.prizes.map((p) => ({
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

export const onFakeTaskUpdate = async (
  taskId: string,
  data?: unknown
): Promise<unknown> => {
  toast.success(`Task ${taskId} updated (not implemented in preview)`);
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

export const onFakeTaskAction = async (
  taskId: string,
  data?: unknown
): Promise<unknown> => {
  toast.success(`Task action ${taskId} triggered (not implemented in preview)`);
  return Promise.resolve(data);
};

export const onFakeCreateReferral = async (
  params: CreateReferralSchema
): Promise<UserReferralSchema> => {
  toast.success(
    `Referral created for sweepstakes ${params.sweepstakesId} (not implemented in preview)`
  );
  return Promise.resolve(mockUserReferral);
};
