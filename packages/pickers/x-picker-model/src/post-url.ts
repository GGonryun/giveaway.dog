const X_POST_HOSTS = [
  'x.com',
  'www.x.com',
  'mobile.x.com',
  'twitter.com',
  'www.twitter.com',
  'mobile.twitter.com',
  't.co'
];

const X_USERNAME = /^[A-Za-z0-9_]{1,15}$/;

export const isXPostUrl = (url: unknown): boolean => {
  try {
    const { protocol, hostname } = new URL(String(url));
    return (
      (protocol === 'https:' || protocol === 'http:') &&
      X_POST_HOSTS.includes(hostname)
    );
  } catch {
    return false;
  }
};

export const toCanonicalXPostUrl = ({
  id,
  username
}: {
  id: string;
  username?: string | null;
}): string => {
  const author = username && X_USERNAME.test(username) ? username : 'i';
  return `https://x.com/${author}/status/${encodeURIComponent(id)}`;
};
