export type PlatformId =
  | 'twitter'
  | 'x'
  | 'bluesky'
  | 'twitch'
  | 'tiktok'
  | 'kick'
  | 'facebook'
  | 'snapchat'
  | 'threads'
  | 'linkedin'
  | 'pinterest'
  | 'reddit'
  | 'instagram'
  | 'youtube'
  | 'discord'
  | 'tumblr'
  | 'github'
  | 'google'
  | 'patreon'
  | 'producthunt'
  | 'coinbase'
  | 'spotify'
  | 'steam';

interface PlatformIcon {
  light: string;
  dark?: string;
}

export const PLATFORM_ICONS: Record<PlatformId, PlatformIcon> = {
  twitter: { light: '/platforms/x.svg' },
  x: { light: '/platforms/x.svg' },
  bluesky: { light: '/platforms/bluesky.svg' },
  twitch: { light: '/platforms/twitch.svg' },
  tiktok: { light: '/platforms/tiktok.svg' },
  kick: { light: '/platforms/kick.svg' },
  facebook: { light: '/platforms/facebook.svg' },
  snapchat: { light: '/platforms/snapchat.svg' },
  threads: {
    light: '/platforms/threads.svg',
    dark: '/platforms/threads-white.svg'
  },
  linkedin: { light: '/platforms/linkedin.svg' },
  pinterest: { light: '/platforms/pinterest.svg' },
  reddit: { light: '/platforms/reddit.svg' },
  instagram: { light: '/platforms/instagram.svg' },
  youtube: { light: '/platforms/youtube.svg' },
  discord: { light: '/platforms/discord.svg' },
  tumblr: { light: '/platforms/tumblr.svg' },
  github: {
    light: '/platforms/github.svg',
    dark: '/platforms/github-white.svg'
  },
  google: { light: '/platforms/google.svg' },
  patreon: {
    light: '/platforms/patreon.svg',
    dark: '/platforms/patreon-white.svg'
  },
  producthunt: { light: '/platforms/producthunt.svg' },
  coinbase: { light: '/platforms/coinbase.svg' },
  spotify: { light: '/platforms/spotify.svg' },
  steam: { light: '/platforms/steam.svg' }
};

export function getPlatformIcon(
  platformId: PlatformId,
  theme?: 'light' | 'dark' | null
): string {
  const icon = PLATFORM_ICONS[platformId];
  if (!icon) {
    console.warn(`Platform icon not found for: ${platformId}`);
    return '/platforms/default.svg';
  }

  if (theme === 'dark' && icon.dark) {
    return icon.dark;
  }
  return icon.light;
}
