export const xProfileRefineUrl = (url: string) => {
  const urlPattern = /^https?:\/\/(www\.)?x\.com\/[A-Za-z0-9_]{1,16}$/;
  return urlPattern.test(url);
};

export const xProfileRefineError =
  'Unexpected URL, should be like https://x.com/username';

export const xStatusRefineUrl = (url: string) => {
  const urlPattern =
    /^https?:\/\/(www\.)?x\.com\/[A-Za-z0-9_]{1,15}\/status\/\d+$/;
  return urlPattern.test(url);
};
export const xStatusRefineError =
  'Unexpected URL, should be like https://x.com/username/status/1234567890';

export const extractTweetId = (string: string) => {
  //check if it looks like a tweet URL
  if (!xStatusRefineUrl(string)) {
    return string;
  }

  const tweetIdMatch = string.match(/status\/(\d+)/);
  const tweetId = tweetIdMatch ? tweetIdMatch[1] : '';
  return tweetId;
};

export const extractUsernameFromTweetUrl = (url: string): string | null => {
  const match = url.match(/x\.com\/([A-Za-z0-9_]{1,15})\/status/);
  return match ? match[1] : null;
};

export const extractUsernameFromProfileUrl = (url: string): string | null => {
  const match = url.match(/^https?:\/\/(www\.)?x\.com\/([A-Za-z0-9_]{1,16})$/);
  return match ? match[2] : null;
};
