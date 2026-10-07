import { z } from 'zod';

// Instagram supports username format with letters, numbers, dots, and underscores
// Examples:
// - https://instagram.com/username
// - https://www.instagram.com/username/
// - instagram.com/username
// Rejects: Posts (/p/), Reels, Stories, etc. - only profiles allowed
export const instagramProfileUrlSchema = z
  .string()
  .trim()
  .min(1, 'Instagram profile URL is required')
  .refine((url) => {
    const normalized = url.toLowerCase();
    // Match profile URLs only (not posts, reels, etc.)
    const pattern =
      /^(https?:\/\/)?(www\.)?instagram\.com\/([a-zA-Z0-9._]+)\/?$/;
    return pattern.test(normalized);
  }, 'Must be a valid Instagram profile URL (e.g., https://instagram.com/username)');

export const instagramLoginFormSchema = z.object({
  instagramProfileUrl: instagramProfileUrlSchema
});

export type InstagramLoginFormSchema = z.infer<typeof instagramLoginFormSchema>;

// Extract username from Instagram URL
export const extractInstagramUsername = (url: string): string => {
  const normalized = url.toLowerCase();
  const match = normalized.match(/instagram\.com\/([a-zA-Z0-9._]+)/);
  return match ? match[1] : url;
};

// Normalize Instagram URL to consistent format
export const normalizeInstagramUrl = (url: string): string => {
  const username = extractInstagramUsername(url);
  return `https://instagram.com/${username}`;
};
