import 'server-only';

import { z } from 'zod';

export const blueskyProfileSchema = z.object({
  did: z.string(),
  handle: z.string()
});

export const blueskyActorSchema = z.object({
  did: z.string(),
  handle: z.string(),
  displayName: z.string().nullish(),
  avatar: z.string().nullish()
});

export const blueskyLikesSchema = z.object({
  likes: z.array(z.object({ actor: blueskyActorSchema })),
  cursor: z.string().nullish()
});

export const blueskyRepostedBySchema = z.object({
  repostedBy: z.array(blueskyActorSchema),
  cursor: z.string().nullish()
});

export const blueskyOEmbedSchema = z.object({
  html: z.string(),
  author_name: z.string(),
  author_url: z.string()
});
