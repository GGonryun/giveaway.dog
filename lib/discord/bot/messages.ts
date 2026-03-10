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

