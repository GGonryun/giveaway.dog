import { widetype } from './widetype';

export type PlatformId =
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
  | 'steam'
  | 'velora';

interface PlatformIcon {
  light: string;
  dark?: string;
}

export const PLATFORM_ICONS: Record<PlatformId, PlatformIcon> = {
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
  steam: { light: '/platforms/steam.svg' },
  velora: { light: '/platforms/velora.png' }
};

export const PLATFORM_LABELS: Record<PlatformId, string> = {
  x: 'Twitter/X',
  bluesky: 'Bluesky',
  twitch: 'Twitch',
  tiktok: 'TikTok',
  kick: 'Kick',
  facebook: 'Facebook',
  snapchat: 'Snapchat',
  threads: 'Threads',
  linkedin: 'LinkedIn',
  pinterest: 'Pinterest',
  reddit: 'Reddit',
  instagram: 'Instagram',
  youtube: 'YouTube',
  discord: 'Discord',
  tumblr: 'Tumblr',
  github: 'GitHub',
  google: 'Google',
  patreon: 'Patreon',
  producthunt: 'Product Hunt',
  coinbase: 'Coinbase',
  spotify: 'Spotify',
  velora: 'Velora',
  steam: 'Steam'
};

export const PLATFORM_THEMES: Record<PlatformId, string | undefined> = {
  x: '#000000',
  bluesky: '#0085ff',
  twitch: '#9146FF',
  tiktok: '#000000',
  kick: '#53FC18',
  facebook: '#1877F2',
  snapchat: '#FFFC00',
  threads: '#000000',
  linkedin: '#0A66C2',
  pinterest: '#E60023',
  reddit: '#FF4500',
  instagram: '#E4405F',
  youtube: '#FF0000',
  discord: '#5865F2',
  tumblr: '#35465C',
  github: '#181717',
  google: '#4285F4',
  patreon: '#FF424D',
  producthunt: '#DA552F',
  coinbase: '#0052FF',
  spotify: '#1DB954',
  steam: '#171A21',
  velora: '#dca62c'
};

interface PlatformTooltipTheme {
  bg: string;
  text: string;
}

export const PLATFORM_TOOLTIP_THEMES: Record<PlatformId, PlatformTooltipTheme> =
  {
    x: { bg: 'black', text: 'white' },
    bluesky: { bg: 'bluesky-1', text: 'white' },
    twitch: { bg: 'twitch-1', text: 'white' },
    tiktok: { bg: 'black', text: 'white' },
    kick: { bg: 'black', text: 'white' },
    facebook: { bg: 'facebook-1', text: 'white' },
    snapchat: { bg: 'black', text: 'white' },
    threads: { bg: 'black', text: 'white' },
    linkedin: { bg: 'linkedin-1', text: 'white' },
    pinterest: { bg: 'black', text: 'white' },
    reddit: { bg: 'reddit-1', text: 'white' },
    instagram: { bg: 'instagram-1', text: 'white' },
    youtube: { bg: 'youtube-1', text: 'white' },
    discord: { bg: 'discord-1', text: 'white' },
    tumblr: { bg: 'black', text: 'white' },
    github: { bg: 'black', text: 'white' },
    google: { bg: 'black', text: 'white' },
    patreon: { bg: 'black', text: 'white' },
    producthunt: { bg: 'black', text: 'white' },
    coinbase: { bg: 'black', text: 'white' },
    spotify: { bg: 'black', text: 'white' },
    steam: { bg: 'black', text: 'white' },
    velora: { bg: 'velora-1', text: 'black' }
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

export function getPlatformLabel(platformId: PlatformId): string {
  return PLATFORM_LABELS[platformId] || platformId;
}

export function getPlatformTheme(platformId: PlatformId): string | undefined {
  return PLATFORM_THEMES[platformId];
}

export function getPlatformTooltipTheme(
  platformId: PlatformId
): PlatformTooltipTheme {
  return PLATFORM_TOOLTIP_THEMES[platformId] || { bg: 'black', text: 'white' };
}

export const SHOW_ON_CAROUSEL: Record<PlatformId, boolean> = {
  x: true,
  bluesky: true,
  twitch: true,
  tiktok: true,
  kick: true,
  facebook: true,
  snapchat: true,
  threads: true,
  linkedin: true,
  pinterest: true,
  reddit: true,
  instagram: true,
  youtube: true,
  discord: true,
  tumblr: true,
  github: true,
  google: true,
  patreon: true,
  producthunt: true,
  coinbase: true,
  spotify: true,
  steam: true,
  velora: true
};

export const CAROUSEL_PLATFORMS = widetype
  .keys(SHOW_ON_CAROUSEL)
  .filter((platformId) => SHOW_ON_CAROUSEL[platformId]);
