import { z } from 'zod';

export const DISCORD_RESPONSE_TYPE = {
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5
};

export const DISCORD_RESPONSE_FLAG = {
  EPHEMERAL: 64
};

export const toEphemeralChannelMessage = (content: string) => ({
  type: DISCORD_RESPONSE_TYPE.CHANNEL_MESSAGE_WITH_SOURCE,
  data: {
    content,
    flags: DISCORD_RESPONSE_FLAG.EPHEMERAL
  }
});

export const toDeferredEphemeralChannelMessage = (content: string) => ({
  type: DISCORD_RESPONSE_TYPE.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
  data: {
    flags: DISCORD_RESPONSE_FLAG.EPHEMERAL,
    content
  }
});

export const toDeferredEphemeralChannelResponse = (content: string) => ({
  content
});

export const ephemeralContentResponse = z.object({
  content: z.string()
});

export const ephemeralEmbedResponse = z.object({
  embeds: z.array(
    z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      color: z.number().optional(),
      footer: z
        .object({
          text: z.string().optional(),
          icon_url: z.string().optional()
        })
        .optional()
    })
  )
});

export const ephemeralChannelResponse = z.union([
  ephemeralContentResponse,
  ephemeralEmbedResponse
]);

export type EphemeralChannelResponse = z.infer<typeof ephemeralChannelResponse>;

export const toEphemeralChannelResponse = (
  response: EphemeralChannelResponse
) => response;
