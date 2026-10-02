import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SAMPLE_SWEEPSTAKES_DATA } from '@/components/demo/sample-sweepstakes-data';
import { PROVIDER_REQUIRED_SCOPES } from '@/lib/integrations/schemas/providers';
import {
  mockAllocation,
  mockParticipant,
  mockPrizes,
  mockSweepstakes,
  mockUserProfile,
  mockUserReferral,
  onFakeAllocate,
  onFakeCompleteProfile,
  onFakeCreateReferral,
  onFakeFormSubmit,
  onFakeLogin,
  onFakeTaskAction,
  onFakeTaskComplete,
  onFakeTaskUpdate
} from '../mocks';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() }
}));

describe('mockAllocation', () => {
  it('allocates the first prize', () => {
    expect(
      mockAllocation([
        { prizeId: 'prize-1', prizeName: 'Gift Card', quota: 1, draws: [] },
        { prizeId: 'prize-2', prizeName: 'Poster', quota: 2, draws: [] }
      ])
    ).toEqual({ prize: { id: 'prize-1', name: 'Gift Card' } });
  });

  it('has no allocation without prizes', () => {
    expect(mockAllocation([])).toBeUndefined();
  });
});

describe('fake handlers', () => {
  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
  });

  it('announces a fake allocation', async () => {
    await expect(
      onFakeAllocate({ prize: { id: 'prize-1', name: 'Gift Card' } })
    ).resolves.toBeUndefined();
    expect(toast.success).toHaveBeenCalledWith(
      'Allocate action for prize Gift Card triggered (not implemented in preview)'
    );
  });

  it('announces a fake login', () => {
    onFakeLogin();
    expect(toast.success).toHaveBeenCalledWith(
      'Login action triggered (not implemented in preview)'
    );
  });

  it('announces a fake profile completion', () => {
    onFakeCompleteProfile();
    expect(toast.success).toHaveBeenCalledWith(
      'Complete profile action triggered (not implemented in preview)'
    );
  });

  it.each([
    [onFakeTaskComplete, 'Task task-1 completed (not implemented in preview)'],
    [onFakeTaskUpdate, 'Task task-1 updated (not implemented in preview)'],
    [
      onFakeTaskAction,
      'Task action task-1 triggered (not implemented in preview)'
    ]
  ])(
    'announces the task and resolves with its data (%#)',
    async (handler, message) => {
      const data = { answer: 'yes' };
      await expect(handler('task-1', data)).resolves.toBe(data);
      expect(toast.success).toHaveBeenCalledWith(message);
    }
  );

  it('announces a fake form submission', async () => {
    await expect(onFakeFormSubmit({ email: 'a@b.c' })).resolves.toBeUndefined();
    expect(toast.success).toHaveBeenCalledWith(
      'Form submitted (not implemented in preview)'
    );
  });

  it('returns the mock referral for a fake referral', async () => {
    await expect(
      onFakeCreateReferral({ sweepstakesId: 'sweepstakes-1', taskId: 'task-1' })
    ).resolves.toBe(mockUserReferral);
    expect(toast.success).toHaveBeenCalledWith(
      'Referral created for sweepstakes sweepstakes-1 (not implemented in preview)'
    );
  });
});

describe('mock data', () => {
  it('builds the prize summaries from the sample sweepstakes', () => {
    expect(mockPrizes).toEqual(
      SAMPLE_SWEEPSTAKES_DATA.prizes.map((prize) => ({
        prizeId: prize.id,
        prizeName: prize.name,
        quota: prize.quota,
        draws: []
      }))
    );
  });

  it('runs the sample sweepstakes', () => {
    expect(mockSweepstakes).toMatchObject({
      id: 'preview-sweepstake',
      status: 'RUNNING',
      setup: SAMPLE_SWEEPSTAKES_DATA.setup
    });
  });

  it('uses the preview user as the participant', () => {
    expect(mockParticipant).toMatchObject({
      id: 'preview-participant',
      user: mockUserProfile,
      allocation: null,
      completions: []
    });
  });

  it('connects the preview user with the required scopes of every provider', () => {
    for (const provider of mockUserProfile.providers) {
      expect(provider.status).toBe('ACTIVE');
      expect(provider.scopes).toEqual(PROVIDER_REQUIRED_SCOPES[provider.type]);
    }
    expect(new Set(mockUserProfile.providers.map((p) => p.type)).size).toBe(
      mockUserProfile.providers.length
    );
  });

  it('links the referral to its code', () => {
    expect(mockUserReferral.link).toMatch(/\/referral\/PREVIEW123$/);
    expect(mockUserReferral.code).toBe('PREVIEW123');
  });

  it.fails('gives the preview user a valid birthday', () => {
    expect(Number.isNaN(mockUserProfile.birthday?.getTime())).toBe(false);
  });
});
