import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleApplicationCommandRequest } from '../application';
import { discordConnectWorkflow } from '../../../workflows/discord-connect/workflow';
import { applicationCommandInteraction } from '../../../__tests__/fixtures-discord-model';

const workflowApi = vi.hoisted(() => ({ start: vi.fn() }));

vi.mock('workflow/api', () => workflowApi);

describe('handleApplicationCommandRequest', () => {
  beforeEach(() => {
    workflowApi.start.mockReset();
  });

  it('starts the discord connect workflow with the interaction body', async () => {
    const body = applicationCommandInteraction();

    await handleApplicationCommandRequest({ body });

    expect(workflowApi.start).toHaveBeenCalledTimes(1);
    expect(workflowApi.start).toHaveBeenCalledWith(discordConnectWorkflow, [
      { body }
    ]);
  });

  it('responds with a deferred ephemeral processing message', async () => {
    const response = await handleApplicationCommandRequest({
      body: applicationCommandInteraction()
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      type: 5,
      data: {
        flags: 64,
        content:
          'Processing your request... Please wait a few seconds and do not close this message.'
      }
    });
  });

  it('does not wait for the workflow to finish before responding', async () => {
    workflowApi.start.mockReturnValue(new Promise(() => undefined));

    const response = await handleApplicationCommandRequest({
      body: applicationCommandInteraction()
    });

    expect(response.status).toBe(200);
  });

  it('propagates a synchronous failure to start the workflow', async () => {
    workflowApi.start.mockImplementation(() => {
      throw new Error('workflow unavailable');
    });

    await expect(
      handleApplicationCommandRequest({ body: applicationCommandInteraction() })
    ).rejects.toThrow('workflow unavailable');
  });
});
