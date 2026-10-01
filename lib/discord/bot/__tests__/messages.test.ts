import { describe, it, expect } from 'vitest';
import {
  DISCORD_RESPONSE_FLAG,
  DISCORD_RESPONSE_TYPE,
  toDeferredEphemeralChannelMessage,
  toEphemeralChannelMessage
} from '../messages';

describe('DISCORD_RESPONSE_TYPE', () => {
  it('maps response names to discord interaction callback types', () => {
    expect(DISCORD_RESPONSE_TYPE).toEqual({
      CHANNEL_MESSAGE_WITH_SOURCE: 4,
      DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5
    });
  });
});

describe('DISCORD_RESPONSE_FLAG', () => {
  it('uses the discord ephemeral message flag', () => {
    expect(DISCORD_RESPONSE_FLAG).toEqual({ EPHEMERAL: 64 });
  });
});

describe('toEphemeralChannelMessage', () => {
  it('builds an immediate ephemeral channel message', () => {
    expect(toEphemeralChannelMessage('Hello there')).toEqual({
      type: 4,
      data: { content: 'Hello there', flags: 64 }
    });
  });

  it('keeps empty content as is', () => {
    expect(toEphemeralChannelMessage('').data.content).toBe('');
  });

  it('passes the content through without trimming or escaping', () => {
    expect(toEphemeralChannelMessage('  **Done** <@1>\n').data.content).toBe(
      '  **Done** <@1>\n'
    );
  });
});

describe('toDeferredEphemeralChannelMessage', () => {
  it('builds a deferred ephemeral channel message', () => {
    expect(toDeferredEphemeralChannelMessage('Working on it')).toEqual({
      type: 5,
      data: { flags: 64, content: 'Working on it' }
    });
  });

  it('passes the content through without trimming or escaping', () => {
    expect(
      toDeferredEphemeralChannelMessage('  **Wait** <@1>\n').data.content
    ).toBe('  **Wait** <@1>\n');
  });
});
