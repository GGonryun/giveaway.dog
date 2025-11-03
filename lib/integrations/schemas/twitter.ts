export const xStatusRefineUrl = (url: string) => {
  const urlPattern =
    /^https?:\/\/(www\.)?x\.com\/[A-Za-z0-9_]{1,15}\/status\/\d+$/;
  return urlPattern.test(url);
};
export const xStatusRefineError =
  'Unexpected URL, should be like https://x.com/username/status/1234567890';

export const extractTweetId = (string: string) => {
  const tweetIdMatch = string.match(/status\/(\d+)/);
  const tweetId = tweetIdMatch ? tweetIdMatch[1] : '';
  return tweetId;
};
