export const blueskyPostRefineUrl = (url: string) => {
  const urlPattern =
    /^https?:\/\/bsky\.app\/profile\/[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+\/post\/[a-zA-Z0-9]+\/?$/;
  return urlPattern.test(url);
};

export const blueskyPostRefineError =
  'Unexpected URL, should be like https://bsky.app/profile/username.bsky.social/post/postId/';
