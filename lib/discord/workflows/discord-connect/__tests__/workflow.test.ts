import { describe, it, expect, vi, beforeEach } from 'vitest';
import { discordConnectWorkflow } from '../workflow';
import { commandInteraction } from '@/lib/discord/__tests__/fixtures-discord-procedures-workflows';

const m = vi.hoisted(() => ({
  processConnect: vi.fn(),
  patchDiscordWebhook: vi.fn()
}));

vi.mock('../steps/process-connect', () => ({
  processConnect: m.processConnect
}));

vi.mock('../../discord-interaction/steps/patch-discord-webhook', () => ({
  patchDiscordWebhook: m.patchDiscordWebhook
}));

describe('discordConnectWorkflow', () => {
  beforeEach(() => {
    m.processConnect.mockReset();
    m.patchDiscordWebhook.mockReset();
    m.patchDiscordWebhook.mockResolvedValue(undefined);
  });

  it('processes the connect command with the interaction body', async () => {
    const body = commandInteraction();
    m.processConnect.mockResolvedValue({ content: 'ok', success: true });

    await discordConnectWorkflow({ body });

    expect(m.processConnect).toHaveBeenCalledWith({ body });
  });

  it('patches the original interaction response with the processing result', async () => {
    const body = commandInteraction({
      application_id: 'app-77',
      token: 'token-77'
    });
    const result = {
      content: 'Please provide a registration key. Usage: `/connect KEY`',
      flags: 64,
      success: false
    };
    m.processConnect.mockResolvedValue(result);

    await discordConnectWorkflow({ body });

    expect(m.patchDiscordWebhook).toHaveBeenCalledWith({
      applicationId: 'app-77',
      token: 'token-77',
      message: result
    });
  });

  it('patches the response only after processing completes', async () => {
    m.processConnect.mockResolvedValue({ success: true });

    await discordConnectWorkflow({ body: commandInteraction() });

    const [processOrder] = m.processConnect.mock.invocationCallOrder;
    const [patchOrder] = m.patchDiscordWebhook.mock.invocationCallOrder;
    expect(processOrder).toBeLessThan(patchOrder);
  });

  it('resolves to undefined', async () => {
    m.processConnect.mockResolvedValue({ success: true });

    await expect(
      discordConnectWorkflow({ body: commandInteraction() })
    ).resolves.toBeUndefined();
  });

  it('does not patch the response when processing throws', async () => {
    m.processConnect.mockRejectedValue(new Error('step crashed'));

    await expect(
      discordConnectWorkflow({ body: commandInteraction() })
    ).rejects.toThrow('step crashed');
    expect(m.patchDiscordWebhook).not.toHaveBeenCalled();
  });

  it('propagates a failure to patch the response', async () => {
    m.processConnect.mockResolvedValue({ success: true });
    m.patchDiscordWebhook.mockRejectedValue(new Error('patch failed'));

    await expect(
      discordConnectWorkflow({ body: commandInteraction() })
    ).rejects.toThrow('patch failed');
  });
});
