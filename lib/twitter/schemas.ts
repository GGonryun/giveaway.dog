export const xStatusRefineUrl = (url: string) => {
  const urlPattern =
    /^https?:\/\/(www\.)?x\.com\/[A-Za-z0-9_]{1,15}\/status\/\d+$/;
  return urlPattern.test(url);
};
export const xStatusRefineError =
  'Unexpected URL, should be like https://x.com/username/status/1234567890';
