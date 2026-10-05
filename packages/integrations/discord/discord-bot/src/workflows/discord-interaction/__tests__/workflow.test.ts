import { describe, it, expect, vi, beforeEach } from 'vitest';
import { discordInteractionWorkflow } from '../workflow';
import {
  buttonInteraction,
  discordMember
} from '@giveaway/discord-model/testing/fixtures-discord-procedures-workflows';

const m = vi.hoisted(() => ({
  fetchTask: vi.fn(),
  validateEntry: vi.fn(),
  commitEntry: vi.fn(),
  patchDiscordWebhook: vi.fn(),
  updateDiscordEmbed: vi.fn(),
  scheduleRewards: vi.fn()
}));

vi.mock('../steps/fetch-task', () => ({ fetchTask: m.fetchTask }));
vi.mock('../steps/validate-entry', () => ({
  validateEntry: m.validateEntry
}));
vi.mock('../steps/commit-entry', () => ({ commitEntry: m.commitEntry }));
vi.mock('../steps/patch-discord-webhook', () => ({
  patchDiscordWebhook: m.patchDiscordWebhook
}));
vi.mock('../steps/update-discord-embed', () => ({
  updateDiscordEmbed: m.updateDiscordEmbed
}));
vi.mock('../steps/schedule-rewards', () => ({
  scheduleRewards: m.scheduleRewards
}));

const webhookTarget = { applicationId: 'app-1', token: 'interaction-token' };

const embedTarget = {
  channelId: 'channel-1',
  messageId: 'message-1',
  sweepstakesId: 'sweep-1'
};

const validResult = (member = discordMember()) => ({
  valid: true,
  discordUserId: 'discord-user-1',
  member,
  existingUserId: 'user-existing'
});

describe('discordInteractionWorkflow', () => {
  beforeEach(() => {
    for (const fn of Object.values(m)) {
      fn.mockReset();
    }
    m.patchDiscordWebhook.mockResolvedValue(undefined);
    m.updateDiscordEmbed.mockResolvedValue(undefined);
    m.scheduleRewards.mockResolvedValue(undefined);
    m.commitEntry.mockResolvedValue({ userId: 'user-final' });
    m.fetchTask.mockResolvedValue({
      status: 'active',
      roles: ['role-a'],
      sweepstakesId: 'sweep-1'
    });
    m.validateEntry.mockResolvedValue(validResult());
  });

  it('fetches the task identified by the task id', async () => {
    await discordInteractionWorkflow({
      body: buttonInteraction(),
      taskId: 'task-1'
    });

    expect(m.fetchTask).toHaveBeenCalledWith({ taskId: 'task-1' });
  });

  describe('when the task cannot be used', () => {
    beforeEach(() => {
      m.fetchTask.mockResolvedValue({
        status: 'error',
        content: 'This giveaway task no longer exists.'
      });
    });

    it('replies with the task error as an ephemeral message', async () => {
      await discordInteractionWorkflow({
        body: buttonInteraction(),
        taskId: 'task-1'
      });

      expect(m.patchDiscordWebhook).toHaveBeenCalledTimes(1);
      expect(m.patchDiscordWebhook).toHaveBeenCalledWith({
        ...webhookTarget,
        message: {
          content: 'This giveaway task no longer exists.',
          flags: 64
        }
      });
    });

    it('stops without validating, committing or updating the embed', async () => {
      await discordInteractionWorkflow({
        body: buttonInteraction(),
        taskId: 'task-1'
      });

      expect(m.validateEntry).not.toHaveBeenCalled();
      expect(m.commitEntry).not.toHaveBeenCalled();
      expect(m.updateDiscordEmbed).not.toHaveBeenCalled();
      expect(m.scheduleRewards).not.toHaveBeenCalled();
    });
  });

  describe('when the giveaway has ended', () => {
    beforeEach(() => {
      m.fetchTask.mockResolvedValue({
        status: 'ended',
        sweepstakesId: 'sweep-1'
      });
    });

    it('replies that the giveaway has ended', async () => {
      await discordInteractionWorkflow({
        body: buttonInteraction(),
        taskId: 'task-1'
      });

      expect(m.patchDiscordWebhook).toHaveBeenCalledWith({
        ...webhookTarget,
        message: { content: 'This giveaway has already ended.', flags: 64 }
      });
    });

    it('refreshes the giveaway embed after replying', async () => {
      await discordInteractionWorkflow({
        body: buttonInteraction(),
        taskId: 'task-1'
      });

      expect(m.updateDiscordEmbed).toHaveBeenCalledWith(embedTarget);
      const [patchOrder] = m.patchDiscordWebhook.mock.invocationCallOrder;
      const [embedOrder] = m.updateDiscordEmbed.mock.invocationCallOrder;
      expect(patchOrder).toBeLessThan(embedOrder);
    });

    it('does not validate or commit an entry', async () => {
      await discordInteractionWorkflow({
        body: buttonInteraction(),
        taskId: 'task-1'
      });

      expect(m.validateEntry).not.toHaveBeenCalled();
      expect(m.commitEntry).not.toHaveBeenCalled();
      expect(m.scheduleRewards).not.toHaveBeenCalled();
    });
  });

  describe('when the giveaway is active', () => {
    it('validates the entry with the task roles and sweepstakes id', async () => {
      const body = buttonInteraction();

      await discordInteractionWorkflow({ body, taskId: 'task-1' });

      expect(m.validateEntry).toHaveBeenCalledWith({
        body,
        taskId: 'task-1',
        roles: ['role-a'],
        sweepstakesId: 'sweep-1'
      });
    });

    it('replies with the validation message as ephemeral when the entry is invalid', async () => {
      m.validateEntry.mockResolvedValue({
        valid: false,
        content: "You've already entered this giveaway!"
      });

      await discordInteractionWorkflow({
        body: buttonInteraction(),
        taskId: 'task-1'
      });

      expect(m.patchDiscordWebhook).toHaveBeenCalledTimes(1);
      expect(m.patchDiscordWebhook).toHaveBeenCalledWith({
        ...webhookTarget,
        message: {
          content: "You've already entered this giveaway!",
          flags: 64
        }
      });
      expect(m.commitEntry).not.toHaveBeenCalled();
      expect(m.updateDiscordEmbed).not.toHaveBeenCalled();
    });

    it('uses the flags provided by an invalid validation result', async () => {
      m.validateEntry.mockResolvedValue({
        valid: false,
        content: 'Visible error',
        flags: 0
      });

      await discordInteractionWorkflow({
        body: buttonInteraction(),
        taskId: 'task-1'
      });

      expect(m.patchDiscordWebhook).toHaveBeenCalledWith({
        ...webhookTarget,
        message: { content: 'Visible error', flags: 0 }
      });
    });

    it('confirms the entry to the user', async () => {
      await discordInteractionWorkflow({
        body: buttonInteraction(),
        taskId: 'task-1'
      });

      expect(m.patchDiscordWebhook).toHaveBeenCalledTimes(1);
      expect(m.patchDiscordWebhook).toHaveBeenCalledWith({
        ...webhookTarget,
        message: { content: 'Your entry is confirmed!', flags: 64 }
      });
    });

    it('commits the entry with the validated identity', async () => {
      const member = discordMember({ nick: 'Validated' });
      m.validateEntry.mockResolvedValue(validResult(member));
      const body = buttonInteraction();

      await discordInteractionWorkflow({ body, taskId: 'task-1' });

      expect(m.commitEntry).toHaveBeenCalledWith({
        body,
        taskId: 'task-1',
        sweepstakesId: 'sweep-1',
        existingUserId: 'user-existing',
        member,
        discordUserId: 'discord-user-1'
      });
    });

    it('sends the confirmation before committing the entry', async () => {
      await discordInteractionWorkflow({
        body: buttonInteraction(),
        taskId: 'task-1'
      });

      const [patchOrder] = m.patchDiscordWebhook.mock.invocationCallOrder;
      const [commitOrder] = m.commitEntry.mock.invocationCallOrder;
      expect(patchOrder).toBeLessThan(commitOrder);
    });

    it('refreshes the embed and schedules rewards for the committed user', async () => {
      await discordInteractionWorkflow({
        body: buttonInteraction(),
        taskId: 'task-1'
      });

      expect(m.updateDiscordEmbed).toHaveBeenCalledWith(embedTarget);
      expect(m.scheduleRewards).toHaveBeenCalledWith({
        sweepstakesId: 'sweep-1',
        userId: 'user-final'
      });
      const [embedOrder] = m.updateDiscordEmbed.mock.invocationCallOrder;
      const [rewardsOrder] = m.scheduleRewards.mock.invocationCallOrder;
      expect(embedOrder).toBeLessThan(rewardsOrder);
    });

    it('skips the embed refresh and rewards when the interaction has no member', async () => {
      await discordInteractionWorkflow({
        body: buttonInteraction({ member: undefined }),
        taskId: 'task-1'
      });

      expect(m.commitEntry).toHaveBeenCalled();
      expect(m.updateDiscordEmbed).not.toHaveBeenCalled();
      expect(m.scheduleRewards).not.toHaveBeenCalled();
    });

    it('propagates a commit failure after the confirmation was already sent', async () => {
      m.commitEntry.mockRejectedValue(new Error('commit failed'));

      await expect(
        discordInteractionWorkflow({
          body: buttonInteraction(),
          taskId: 'task-1'
        })
      ).rejects.toThrow('commit failed');
      expect(m.patchDiscordWebhook).toHaveBeenCalledWith({
        ...webhookTarget,
        message: { content: 'Your entry is confirmed!', flags: 64 }
      });
      expect(m.updateDiscordEmbed).not.toHaveBeenCalled();
      expect(m.scheduleRewards).not.toHaveBeenCalled();
    });

    it('resolves to undefined', async () => {
      await expect(
        discordInteractionWorkflow({
          body: buttonInteraction(),
          taskId: 'task-1'
        })
      ).resolves.toBeUndefined();
    });
  });
});
