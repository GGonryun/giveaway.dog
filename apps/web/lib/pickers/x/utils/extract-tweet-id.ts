export function extractTweetId(url: string): string | null {
  try {
    const match = url.match(/status\/(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
