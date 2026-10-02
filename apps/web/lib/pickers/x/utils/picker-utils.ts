export function selectRandomUnique<T>(array: T[], count: number): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

export function getDisqualificationReason(
  user: {
    tweetCount?: number | null;
    followersCount?: number | null;
    followingCount?: number | null;
    profileImageUrl?: string | null;
    bannerImageUrl?: string | null;
    location?: string | null;
    description?: string | null;
    createdAt?: string | Date | null;
  },
  picker: {
    minPostCount?: number | null;
    minFollowersCount?: number | null;
    minFollowingCount?: number | null;
    minAccountAgeDays?: number | null;
    requireProfileImage?: boolean | null;
    requireBannerImage?: boolean | null;
    requireLocation?: boolean | null;
    requireBio?: boolean | null;
  }
): string | undefined {
  if (
    picker.minPostCount !== null &&
    picker.minPostCount !== undefined &&
    (user.tweetCount ?? 0) < picker.minPostCount
  ) {
    return `Minimum ${picker.minPostCount} posts required`;
  }

  if (
    picker.minFollowersCount !== null &&
    picker.minFollowersCount !== undefined &&
    (user.followersCount ?? 0) < picker.minFollowersCount
  ) {
    return `Minimum ${picker.minFollowersCount} followers required`;
  }

  if (
    picker.minFollowingCount !== null &&
    picker.minFollowingCount !== undefined &&
    (user.followingCount ?? 0) < picker.minFollowingCount
  ) {
    return `Minimum ${picker.minFollowingCount} following required`;
  }

  if (
    picker.minAccountAgeDays !== null &&
    picker.minAccountAgeDays !== undefined &&
    user.createdAt
  ) {
    const createdAtDate =
      typeof user.createdAt === 'string'
        ? new Date(user.createdAt)
        : user.createdAt;
    const accountAgeDays = Math.floor(
      (Date.now() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (accountAgeDays < picker.minAccountAgeDays) {
      return `Account must be at least ${picker.minAccountAgeDays} days old`;
    }
  }

  if (picker.requireProfileImage && !user.profileImageUrl) {
    return 'Profile image required';
  }

  if (picker.requireBannerImage && !user.bannerImageUrl) {
    return 'Banner image required';
  }

  if (picker.requireLocation && !user.location) {
    return 'Location required';
  }

  if (picker.requireBio && !user.description) {
    return 'Bio required';
  }

  return undefined;
}
