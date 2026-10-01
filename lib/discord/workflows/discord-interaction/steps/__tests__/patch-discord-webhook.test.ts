import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { patchDiscordWebhook } from '../patch-discord-webhook';
import type { DiscordFollowupMessage } from '../patch-discord-webhook';

const EXPECTED_URL =
  'https://discord.com/api/v10/webhooks/app-1/token-1/messages/@original';

describe('patchDiscordWebhook', () => {
  const fetchMock = vi.fn<typeof fetch>();

  const patch = (message: DiscordFollowupMessage) =>
    patchDiscordWebhook({ applicationId: 'app-1', token: 'token-1', message });

  const sentBody = () => {
    const [, init] = fetchMock.mock.calls[0];
    return JSON.parse((init as RequestInit).body as string);
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends a PATCH request to the original interaction response', async () => {
    await patch({ content: 'hello' });

    expect(fetchMock).toHaveBeenCalledWith(EXPECTED_URL, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'hello' })
    });
  });

  it('sends content, embeds and flags when all are provided', async () => {
    await patch({
      content: 'hello',
      embeds: [{ title: 'Title', color: 1 }],
      flags: 64
    });

    expect(sentBody()).toEqual({
      content: 'hello',
      embeds: [{ title: 'Title', color: 1 }],
      flags: 64
    });
  });

  it('omits fields that are undefined', async () => {
    await patch({ embeds: [{ title: 'Only embeds' }] });

    expect(sentBody()).toEqual({ embeds: [{ title: 'Only embeds' }] });
  });

  it('sends an empty object when the message has no fields', async () => {
    await patch({});

    expect(fetchMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({ body: '{}' })
    );
  });

  it('keeps falsy but defined values such as an empty string and zero flags', async () => {
    await patch({ content: '', flags: 0 });

    expect(sentBody()).toEqual({ content: '', flags: 0 });
  });

  it('drops properties that are not part of a followup message', async () => {
    await patch({
      content: 'hi',
      success: true
    } as unknown as DiscordFollowupMessage);

    expect(sentBody()).toEqual({ content: 'hi' });
  });

  it('resolves without error when discord responds with a failure status', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 404 }));

    await expect(patch({ content: 'hi' })).resolves.toBeUndefined();
  });

  it('propagates a network failure', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    await expect(patch({ content: 'hi' })).rejects.toThrow('network down');
  });
});
