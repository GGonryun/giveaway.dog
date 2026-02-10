// TODO: fix any
export const getAccountLabel = (
  account: any,
  profile: undefined | any
): string | null => {
  switch (account.provider) {
    case 'google':
    case 'email':
      return profile?.email || null;
    case 'discord': {
      return (
        profile?.username ||
        profile?.global_name ||
        profile?.name ||
        profile?.email ||
        null
      );
    }
    case 'twitter':
      return profile?.username ? profile.username : null;
    case 'steam':
      return profile?.name || null;
    case 'twitch':
      return profile?.name || null;
    case 'kick':
      return profile?.username || profile?.name || null;
    case 'facebook':
      return profile?.name || profile?.email || null;
    case 'tiktok':
      return (
        profile?.username || profile?.display_name || profile?.name || null
      );
    case 'bluesky':
      return profile?.handle || null;
    case 'velora':
      return (
        profile?.username || profile?.display_name || profile?.name || null
      );
    default:
      return null;
  }
};

export const getAccountLink = (
  account: any,
  profile: undefined | any
): string | null => {
  const label = getAccountLabel(account, profile);

  switch (account.provider) {
    case 'twitter':
      if (!label) return null;
      return `https://x.com/${label.replace(/^@/, '')}`;
    case 'twitch':
      if (!label) return null;
      return `https://www.twitch.tv/${label.toLowerCase()}`;
    case 'steam':
      if (!account.providerAccountId) return null;
      return `https://steamcommunity.com/profiles/${account.providerAccountId}`;
    case 'kick':
      if (!label) return null;
      return `https://kick.com/${label.toLowerCase()}`;
    case 'discord':
      if (!account.providerAccountId) return null;
      return `https://discord.com/users/${account.providerAccountId}`;
    case 'google':
      if (!label) return null;
      return `mailto:${label}`;
    case 'facebook':
      if (!profile?.link) return null;
      return profile.link;
    case 'tiktok':
      if (!profile?.profile_deep_link) return null;
      return profile.profile_deep_link;
    case 'bluesky':
      if (!label) return null;
      return `https://bsky.app/profile/${label}`;
    case 'velora':
      if (!label) return null;
      return `https://velora.tv/${label}`;
    default:
      return null;
  }
};
