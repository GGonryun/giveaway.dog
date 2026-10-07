const SECRET_KEY = /(token|secret|password|e-?mail|jwt)s?$/i;

const WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];

export const MAX_PEOPLE = WORDS.length;

const capitalize = (word: string) => word[0].toUpperCase() + word.slice(1);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const redactSecrets = (value: unknown, key = ''): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item));
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entry]) => [
        entryKey,
        redactSecrets(entry, entryKey)
      ])
    );
  }
  if (typeof value === 'string' && SECRET_KEY.test(key)) {
    return `redacted-${key.replaceAll('_', '-')}`;
  }
  return value;
};

export const replaceText = (value: unknown, replacement: string): unknown =>
  typeof value === 'string' && value !== '' ? replacement : value;

export const replaceFields = (
  value: unknown,
  replacements: Record<string, string>
): unknown => {
  if (!isRecord(value)) {
    return value;
  }
  return {
    ...value,
    ...Object.fromEntries(
      Object.entries(replacements)
        .filter(([key]) => key in value)
        .map(([key, replacement]) => [
          key,
          replaceText(value[key], replacement)
        ])
    )
  };
};

export const firstItems = (value: unknown, count = 3): unknown[] =>
  Array.isArray(value) ? value.slice(0, Math.min(count, MAX_PEOPLE)) : [];

export const anonymousXUser = (user: unknown, index: number): unknown => {
  const label = `retweeter_${index + 1}`;
  return replaceFields(user, {
    id: `${10n ** 18n + BigInt(index + 1)}`,
    username: label,
    name: `Retweeter ${index + 1}`,
    description: `Bio of retweeter ${index + 1}`,
    location: `Location ${index + 1}`,
    url: `https://example.com/${label}`,
    profile_image_url: `https://example.com/${label}/profile.jpg`,
    profile_banner_url: `https://example.com/${label}/banner.jpg`
  });
};

export const anonymousDid = (role: string, index: number) =>
  `did:plc:${`${role}${WORDS[index]}`.padEnd(24, '2')}`;

export const anonymousBlueskyActor = (
  actor: unknown,
  role: string,
  index: number
): unknown => {
  const did = anonymousDid(role, index);
  const anonymous = replaceFields(actor, {
    did,
    handle: `${role}-${WORDS[index]}.bsky.social`,
    displayName: `${capitalize(role)} ${capitalize(WORDS[index])}`,
    description: `Bio of ${role} ${WORDS[index]}`,
    avatar: `https://example.com/${role}-${WORDS[index]}/avatar.jpg`,
    banner: `https://example.com/${role}-${WORDS[index]}/banner.jpg`
  });
  return isRecord(anonymous)
    ? {
        ...anonymous,
        ...('viewer' in anonymous
          ? { viewer: { muted: false, blockedBy: false } }
          : {}),
        ...('labels' in anonymous ? { labels: [] } : {})
      }
    : anonymous;
};
