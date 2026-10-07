import { z } from 'zod';

// Facebook supports multiple formats:
// - https://facebook.com/username
// - https://facebook.com/profile.php?id=123456789
// - https://www.facebook.com/username
export const facebookProfileUrlSchema = z
  .string()
  .trim()
  .min(1, 'Facebook profile URL is required')
  .refine((url) => {
    const normalized = url.toLowerCase();
    // Match username-based or ID-based profile URLs
    const usernamePattern =
      /^(https?:\/\/)?(www\.)?facebook\.com\/([a-zA-Z0-9.]+)\/?$/;
    const idPattern =
      /^(https?:\/\/)?(www\.)?facebook\.com\/profile\.php\?id=\d+$/;
    return usernamePattern.test(normalized) || idPattern.test(normalized);
  }, 'Must be a valid Facebook profile URL');

export const facebookLoginFormSchema = z.object({
  facebookProfileUrl: facebookProfileUrlSchema
});

export type FacebookLoginFormSchema = z.infer<typeof facebookLoginFormSchema>;

// Extract identifier from Facebook URL
export const extractFacebookIdentifier = (url: string): string => {
  const normalized = url.toLowerCase();

  // Check for ID-based URL
  const idMatch = normalized.match(/profile\.php\?id=(\d+)/);
  if (idMatch) return idMatch[1];

  // Check for username
  const usernameMatch = normalized.match(/facebook\.com\/([a-zA-Z0-9.]+)/);
  return usernameMatch ? usernameMatch[1] : url;
};

// Normalize Facebook URL to consistent format
export const normalizeFacebookUrl = (url: string): string => {
  const normalized = url.toLowerCase();

  // If it's an ID-based URL, keep that format
  const idMatch = normalized.match(/profile\.php\?id=(\d+)/);
  if (idMatch) return `https://facebook.com/profile.php?id=${idMatch[1]}`;

  // Otherwise normalize to username format
  const identifier = extractFacebookIdentifier(url);
  return `https://facebook.com/${identifier}`;
};
