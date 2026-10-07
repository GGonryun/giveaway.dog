import 'server-only';

import { z } from 'zod';

const blueskyActorSchema = z.object({
  did: z.string(),
  handle: z.string(),
  displayName: z.string().optional(),
  avatar: z.string().optional()
});

export const blueskyProfileSchema = z.object({
  did: z.string(),
  viewer: z
    .object({
      following: z.string().optional()
    })
    .optional()
});

export const blueskyLikesSchema = z.object({
  cursor: z.string().optional(),
  likes: z.array(z.object({ actor: blueskyActorSchema }))
});

export const blueskyRepostedBySchema = z.object({
  cursor: z.string().optional(),
  repostedBy: z.array(blueskyActorSchema)
});

export const blueskyPostThreadSchema = z.object({
  thread: z.object({
    post: z
      .object({
        viewer: z
          .object({
            like: z.string().optional(),
            repost: z.string().optional()
          })
          .optional()
      })
      .optional()
  })
});

export const blueskyCreateRecordSchema = z.object({
  uri: z.string(),
  cid: z.string()
});

export const blueskyOEmbedResponseSchema = z.object({
  html: z.string(),
  author_name: z.string(),
  author_url: z.string()
});
