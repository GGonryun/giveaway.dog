import z from 'zod';

export const listChannelSnippetSchema = z.object({
  title: z.string(),
  description: z.string(),
  customUrl: z.string().optional(),
  publishedAt: z.string(),
  thumbnails: z.object({
    default: z.object({
      url: z.string()
    })
  })
});

export type ListChannelSnippetSchema = z.infer<typeof listChannelSnippetSchema>;
