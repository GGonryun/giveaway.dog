import { JsonValue } from '@prisma/client/runtime/library';
import { z } from 'zod';

export const SUPPORTED_SOCIAL_PLATFORMS = [
  'x',
  'facebook',
  'instagram',
  'discord',
  'reddit',
  'youtube',
  'twitch',
  'tiktok',
  'linkedin',
  'website'
] as const;

export type SocialPlatform = (typeof SUPPORTED_SOCIAL_PLATFORMS)[number];

export const socialLinkSchema = z.object({
  platform: z.enum(SUPPORTED_SOCIAL_PLATFORMS),
  url: z.string().url('Must be a valid URL')
});

export const socialLinksSchema = z.array(socialLinkSchema);

export type SocialLink = z.infer<typeof socialLinkSchema>;

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  x: 'X (Twitter)',
  facebook: 'Facebook',
  instagram: 'Instagram',
  discord: 'Discord',
  reddit: 'Reddit',
  youtube: 'YouTube',
  twitch: 'Twitch',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  website: 'Website'
};

export const PLATFORM_PLACEHOLDERS: Record<SocialPlatform, string> = {
  x: 'https://x.com/username',
  facebook: 'https://facebook.com/username',
  instagram: 'https://instagram.com/username',
  discord: 'https://discord.gg/invite',
  reddit: 'https://reddit.com/r/subreddit',
  youtube: 'https://youtube.com/@channel',
  twitch: 'https://twitch.tv/channel',
  tiktok: 'https://tiktok.com/@username',
  linkedin: 'https://linkedin.com/company/name',
  website: 'https://example.com'
};

export const parseSocialLinks = (data: JsonValue | null): SocialLink[] => {
  if (!data) return [];
  try {
    const parsed = socialLinksSchema.safeParse(data);
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
};
