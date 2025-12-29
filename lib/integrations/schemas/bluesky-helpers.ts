export const blueskyPostRefineUrl = (url: string) => {
  // Pattern for handle-based URLs: https://bsky.app/profile/username.bsky.social/post/postId
  const handleUrlPattern =
    /^https?:\/\/bsky\.app\/profile\/[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+\/post\/[a-zA-Z0-9]+\/?$/;
  // Pattern for DID-based URLs: https://bsky.app/profile/did:plc:xxx/post/postId
  const didUrlPattern =
    /^https?:\/\/bsky\.app\/profile\/did:plc:[a-z0-9]+\/post\/[a-zA-Z0-9]+\/?$/;
  return handleUrlPattern.test(url) || didUrlPattern.test(url);
};

export const blueskyPostRefineError =
  'Unexpected URL, should be like https://bsky.app/profile/username.bsky.social/post/postId/';

export const blueskyProfileRefineUrl = (url: string) => {
  // Pattern for handle-based profile URLs: https://bsky.app/profile/username.bsky.social
  const handleUrlPattern =
    /^https?:\/\/bsky\.app\/profile\/[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+\/?$/;
  // Pattern for DID-based profile URLs: https://bsky.app/profile/did:plc:xxx
  const didUrlPattern =
    /^https?:\/\/bsky\.app\/profile\/did:plc:[a-z0-9]+\/?$/;
  // Pattern for plain handles: username.bsky.social
  const handlePattern =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return handleUrlPattern.test(url) || didUrlPattern.test(url) || handlePattern.test(url);
};

export const blueskyProfileRefineError =
  'Invalid Bluesky profile. Must be a handle (e.g., username.bsky.social) or profile URL (e.g., https://bsky.app/profile/username.bsky.social)';
