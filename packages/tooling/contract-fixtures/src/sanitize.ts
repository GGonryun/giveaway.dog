const SECRET_KEY =
  /(token|secret|password|e-?mail|jwt|phone|cookie|authorization|api_?key|session(_?id)?)s?$/i;

const WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

const LEGACY_DATE =
  /^[A-Z][a-z]{2} [A-Z][a-z]{2} \d{2} \d{2}:\d{2}:\d{2} [+-]\d{4} \d{4}$/;

const ISO_DATE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

const AT_URI = /^at:\/\/([^/]+)(\/.*)?$/;

export const MAX_PEOPLE = WORDS.length;

export const VIEWER_DID = 'did:plc:vxewer2y6kq3m5n7p4r2s3t5';

export type Replace = (value: unknown, key: string) => unknown;

const capitalize = (word: string) => word[0].toUpperCase() + word.slice(1);

const pad = (value: number) => String(value).padStart(2, '0');

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const carriesNoData = (value: unknown) =>
  value === undefined ||
  value === null ||
  value === '' ||
  typeof value === 'boolean';

const cannotAnonymize = (key: string) =>
  new Error(`The recorder cannot anonymize the value of ${key}`);

export const redactSecrets = (value: unknown, key = ''): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item, key));
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

export const keep: Replace = (value) => value;

export const keepAll = (keys: string[]): Record<string, Replace> =>
  Object.fromEntries(keys.map((key) => [key, keep]));

export const plain: Replace = (value, key) => {
  if (typeof value === 'object' && value !== null) {
    throw cannotAnonymize(key);
  }
  return value;
};

export const empty: Replace = (value, key) => {
  if (Array.isArray(value)) {
    return [];
  }
  if (carriesNoData(value)) {
    return value;
  }
  throw cannotAnonymize(key);
};

export const text =
  (replacement: string): Replace =>
  (value, key) => {
    if (carriesNoData(value)) {
      return value;
    }
    if (typeof value === 'string') {
      return replacement;
    }
    throw cannotAnonymize(key);
  };

export const id =
  (replacement: bigint): Replace =>
  (value, key) =>
    typeof value === 'number'
      ? Number(replacement)
      : text(String(replacement))(value, key);

export const count =
  (replacement: number): Replace =>
  (value, key) => {
    if (typeof value === 'number') {
      return replacement;
    }
    if (typeof value === 'string' && /^\d+$/.test(value)) {
      return String(replacement);
    }
    return plain(value, key);
  };

const toLegacyDate = (date: Date) =>
  [
    DAYS[date.getUTCDay()],
    MONTHS[date.getUTCMonth()],
    pad(date.getUTCDate()),
    [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
      .map(pad)
      .join(':'),
    '+0000',
    date.getUTCFullYear()
  ].join(' ');

export const date =
  (replacement: Date): Replace =>
  (value, key) => {
    if (carriesNoData(value)) {
      return value;
    }
    if (typeof value === 'string' && LEGACY_DATE.test(value)) {
      return toLegacyDate(replacement);
    }
    const iso = typeof value === 'string' ? ISO_DATE.exec(value) : null;
    if (!iso) {
      throw cannotAnonymize(key);
    }
    const [, fraction = '', zone] = iso;
    return `${replacement.toISOString().slice(0, 19)}${fraction.replace(/\d/g, '0')}${zone}`;
  };

export const allow = (
  value: unknown,
  fields: Record<string, Replace>,
  key: string
): unknown => {
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([field]) => Object.hasOwn(fields, field))
        .map(([field, entry]) => [field, fields[field](entry, field)])
    );
  }
  if (carriesNoData(value)) {
    return value;
  }
  throw cannotAnonymize(key);
};

export const fields =
  (spec: Record<string, Replace>): Replace =>
  (value, key) =>
    allow(value, spec, key);

export const items =
  (replace: (item: unknown, index: number) => unknown, limit = 3): Replace =>
  (value, key) => {
    if (Array.isArray(value)) {
      return value.slice(0, Math.min(limit, MAX_PEOPLE)).map(replace);
    }
    if (carriesNoData(value)) {
      return value;
    }
    throw cannotAnonymize(key);
  };

export const syntheticDate = (index: number) =>
  new Date(Date.UTC(2020, 0, index + 1, 12));

export const anonymousXUser = (user: unknown, index: number): unknown => {
  const number = index + 1;
  const label = `retweeter_${number}`;
  return allow(
    user,
    {
      id: id(10n ** 18n + BigInt(number)),
      username: text(label),
      name: text(`Retweeter ${number}`),
      description: text(`Bio of retweeter ${number}`),
      location: text(`Location ${number}`),
      url: text(`https://example.com/${label}`),
      profile_image_url: text(`https://example.com/${label}/profile.jpg`),
      profile_banner_url: text(`https://example.com/${label}/banner.jpg`),
      followers_count: count(100 * number),
      following_count: count(10 * number),
      tweet_count: count(1000 * number),
      verified: plain,
      verified_type: plain,
      is_blue_verified: plain,
      created_at: date(syntheticDate(index)),
      can_dm: plain
    },
    label
  );
};

export const anonymousDid = (role: string, index: number) =>
  `did:plc:${`${role}${WORDS[index]}`.padEnd(24, '2')}`;

export const anonymousBlueskyActor = (
  actor: unknown,
  role: string,
  index: number
): unknown => {
  const word = WORDS[index];
  const name = `${role}-${word}`;
  return allow(
    actor,
    {
      did: text(anonymousDid(role, index)),
      handle: text(`${name}.bsky.social`),
      displayName: text(`${capitalize(role)} ${capitalize(word)}`),
      description: text(`Bio of ${role} ${word}`),
      avatar: text(`https://example.com/${name}/avatar.jpg`),
      banner: text(`https://example.com/${name}/banner.jpg`),
      viewer: () => ({ muted: false, blockedBy: false }),
      labels: empty,
      createdAt: date(syntheticDate(index)),
      indexedAt: date(syntheticDate(index))
    },
    name
  );
};

const viewerUri =
  (subjectDid: unknown): Replace =>
  (value, key) => {
    if (carriesNoData(value)) {
      return value;
    }
    const match = typeof value === 'string' ? AT_URI.exec(value) : null;
    if (!match) {
      throw cannotAnonymize(key);
    }
    return match[1] === subjectDid
      ? value
      : `at://${VIEWER_DID}${match[2] ?? ''}`;
  };

export const viewerState = (subjectDid: unknown): Replace =>
  fields({
    muted: plain,
    blockedBy: plain,
    blocking: viewerUri(subjectDid),
    following: viewerUri(subjectDid),
    followedBy: viewerUri(subjectDid),
    like: viewerUri(subjectDid),
    repost: viewerUri(subjectDid),
    bookmarked: plain,
    threadMuted: plain,
    replyDisabled: plain,
    embeddingDisabled: plain,
    pinned: plain
  });
