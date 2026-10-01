import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleButtonInteraction } from '../button';
import { discordInteractionWorkflow } from '../../../workflows/discord-interaction/workflow';
import { buttonInteraction } from '../../../__tests__/fixtures-discord-core';

const workflowApi = vi.hoisted(() => ({ start: vi.fn() }));

vi.mock('workflow/api', () => workflowApi);

describe('handleButtonInteraction', () => {
  beforeEach(() => {
    workflowApi.start.mockReset();
  });

  describe('when the button is a task action', () => {
    it('starts the discord interaction workflow with the body and task id', async () => {
      const body = buttonInteraction('task:enter:task-42');

      await handleButtonInteraction({ body });

      expect(workflowApi.start).toHaveBeenCalledTimes(1);
      expect(workflowApi.start).toHaveBeenCalledWith(
        discordInteractionWorkflow,
        [{ body, taskId: 'task-42' }]
      );
    });

    it('responds with a deferred ephemeral processing message', async () => {
      const response = await handleButtonInteraction({
        body: buttonInteraction('task:enter:task-42')
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        type: 5,
        data: { flags: 64, content: 'Processing your entry... Please wait.' }
      });
    });

    it('starts the workflow regardless of the operation segment', async () => {
      const body = buttonInteraction('task:other:task-7');

      await handleButtonInteraction({ body });

      expect(workflowApi.start).toHaveBeenCalledWith(
        discordInteractionWorkflow,
        [{ body, taskId: 'task-7' }]
      );
    });

    it('starts the workflow with an undefined task id when it is missing', async () => {
      const body = buttonInteraction('task');

      await handleButtonInteraction({ body });

      expect(workflowApi.start).toHaveBeenCalledWith(
        discordInteractionWorkflow,
        [{ body, taskId: undefined }]
      );
    });

    it('does not wait for the workflow to finish before responding', async () => {
      workflowApi.start.mockReturnValue(new Promise(() => undefined));

      const response = await handleButtonInteraction({
        body: buttonInteraction('task:enter:task-1')
      });

      expect(response.status).toBe(200);
    });
  });

  describe('when the button is not a task action', () => {
    it.each(['legacy:enter:task-1', 'TASK:enter:task-1', ''])(
      'responds that the button %j is no longer functional',
      async (customId) => {
        const response = await handleButtonInteraction({
          body: buttonInteraction(customId)
        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
          type: 5,
          data: {
            flags: 64,
            content: 'This button is no longer functional. Please refresh.'
          }
        });
        expect(workflowApi.start).not.toHaveBeenCalled();
      }
    );
  });
});
