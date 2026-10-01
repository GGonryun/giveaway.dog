import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GiveawayParticipation } from '@/components/sweepstakes/giveaway-participation';
import type { GiveawayParticipationProps } from '@/components/sweepstakes/giveaway-participation-context';
import {
  NOW,
  buildGiveawayPrize,
  buildHost,
  buildParticipant,
  buildParticipation,
  buildSweepstakes
} from '@/components/sweepstakes/__tests__/fixtures';
import { allocatePrize } from '@/lib/allocation/procedures/allocate-prize';
import { submitParticipantForm } from '@/lib/custom-fields/procedures/submit-form';
import createReferralCode from '@/lib/referrals/procedures/create-referral-code';
import submitTask from '@/lib/task/procedures/submit-tasks';
import updateTask from '@/lib/task/procedures/update-task';
import {
  SweepstakesParticipationPage,
  type SweepstakesParticipationPageContentProps
} from '../sweepstakes-participation-page-content';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), refresh: vi.fn() },
  pathname: '/browse/summer-giveaway'
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  usePathname: () => navigation.pathname
}));

vi.mock('@/components/sweepstakes/giveaway-participation', () => ({
  GiveawayParticipation: vi.fn(() => null)
}));

vi.mock('@/lib/task/procedures/submit-tasks', () => ({ default: vi.fn() }));
vi.mock('@/lib/task/procedures/update-task', () => ({ default: vi.fn() }));
vi.mock('@/lib/custom-fields/procedures/submit-form', () => ({
  submitParticipantForm: vi.fn()
}));
vi.mock('@/lib/referrals/procedures/create-referral-code', () => ({
  default: vi.fn()
}));
vi.mock('@/lib/allocation/procedures/allocate-prize', () => ({
  allocatePrize: vi.fn()
}));

const baseProps: SweepstakesParticipationPageContentProps = {
  sweepstakes: buildSweepstakes(),
  host: buildHost(),
  prizes: [buildGiveawayPrize()],
  participation: buildParticipation()
};

const renderPage = (
  overrides: Partial<SweepstakesParticipationPageContentProps> = {}
) => render(<SweepstakesParticipationPage {...baseProps} {...overrides} />);

const lastProps = (): GiveawayParticipationProps => {
  const call = vi.mocked(GiveawayParticipation).mock.lastCall;
  if (!call) throw new Error('GiveawayParticipation was not rendered');
  return call[0];
};

describe('SweepstakesParticipationPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the live participation with the page props', () => {
    renderPage();
    expect(lastProps()).toMatchObject({
      ...baseProps,
      participant: undefined,
      className: 'p-4 py-8 sm:py-16',
      isPreview: false,
      verifyEmail: true
    });
  });

  describe('state', () => {
    it('asks a visitor of a running giveaway to log in', () => {
      renderPage();
      expect(lastProps().state).toBe('not-logged-in');
    });

    it('marks a running giveaway as active for a participant with a complete profile', () => {
      renderPage({ participant: buildParticipant() });
      expect(lastProps().state).toBe('active');
    });

    it('marks a completed giveaway as having announced winners', () => {
      renderPage({ sweepstakes: buildSweepstakes({ status: 'COMPLETED' }) });
      expect(lastProps().state).toBe('winners-announced');
    });

    it('marks a draft as closed', () => {
      renderPage({ sweepstakes: buildSweepstakes({ status: 'DRAFT' }) });
      expect(lastProps().state).toBe('closed');
    });
  });

  describe('navigation callbacks', () => {
    it('sends the visitor to the login page and back to the giveaway', () => {
      renderPage();
      lastProps().onLogin();
      expect(navigation.router.push).toHaveBeenCalledWith(
        '/login?redirectTo=%2Fbrowse%2Fsummer-giveaway'
      );
    });

    it('sends the participant to complete their profile', () => {
      renderPage();
      lastProps().onCompleteProfile();
      expect(navigation.router.push).toHaveBeenCalledWith('/profile/complete');
    });
  });

  describe('procedure callbacks', () => {
    it('submits a task for the sweepstakes', async () => {
      vi.mocked(submitTask).mockResolvedValue({ ok: true, data: true });
      renderPage();

      let result: unknown;
      await act(async () => {
        result = await lastProps().onTaskComplete('task-1', { answer: 'blue' });
      });

      expect(submitTask).toHaveBeenCalledWith({
        taskId: 'task-1',
        sweepstakesId: 'sweep-1',
        data: { answer: 'blue' }
      });
      expect(result).toBe(true);
    });

    it('rejects with the failure when a task submission fails', async () => {
      const failure = { code: 'BAD_REQUEST' as const, message: 'Too late' };
      vi.mocked(submitTask).mockResolvedValue({ ok: false, data: failure });
      renderPage();

      await act(async () => {
        await expect(lastProps().onTaskComplete('task-1')).rejects.toEqual(
          failure
        );
      });
    });

    it('updates a task for the sweepstakes', async () => {
      vi.mocked(updateTask).mockResolvedValue({ ok: true, data: true });
      renderPage();

      await act(async () => {
        await lastProps().onTaskUpdate('task-2', { code: 'SECRET' });
      });

      expect(updateTask).toHaveBeenCalledWith({
        taskId: 'task-2',
        sweepstakesId: 'sweep-1',
        data: { code: 'SECRET' }
      });
    });

    it('submits the entry form for the sweepstakes', async () => {
      vi.mocked(submitParticipantForm).mockResolvedValue({
        ok: true,
        data: { success: true }
      });
      renderPage();

      await act(async () => {
        await lastProps().onFormSubmit({ 'field-username': 'janedoe' });
      });

      expect(submitParticipantForm).toHaveBeenCalledWith({
        sweepstakesId: 'sweep-1',
        data: { 'field-username': 'janedoe' }
      });
    });

    it('creates a referral code', async () => {
      const referral = {
        id: 'referral-1',
        code: 'FRIEND42',
        link: 'https://giveaway.dog/browse/summer-giveaway?ref=FRIEND42',
        referrals: []
      };
      vi.mocked(createReferralCode).mockResolvedValue({
        ok: true,
        data: referral
      });
      renderPage();

      let result: unknown;
      await act(async () => {
        result = await lastProps().onCreateReferral({
          taskId: 'task-1',
          sweepstakesId: 'sweep-1'
        });
      });

      expect(createReferralCode).toHaveBeenCalledWith({
        taskId: 'task-1',
        sweepstakesId: 'sweep-1'
      });
      expect(result).toEqual(referral);
    });
  });

  describe('allocating a prize', () => {
    const prize = { id: 'prize-2', name: 'Gift Card' };

    it('requires a participant', async () => {
      renderPage();
      await expect(lastProps().onAllocate({ prize })).rejects.toThrow(
        'Participant information is required to allocate a prize.'
      );
      expect(allocatePrize).not.toHaveBeenCalled();
    });

    it('allocates the prize, updates the participant and refreshes the page', async () => {
      vi.mocked(allocatePrize).mockResolvedValue({
        ok: true,
        data: { success: true }
      });
      renderPage({ participant: buildParticipant({ id: 'participant-9' }) });
      expect(lastProps().participant?.allocation).toBeNull();

      await act(async () => {
        await lastProps().onAllocate({ prize });
      });

      expect(allocatePrize).toHaveBeenCalledWith({
        prizeId: 'prize-2',
        participantId: 'participant-9'
      });
      expect(lastProps().participant?.allocation).toEqual({ prize });
      expect(navigation.router.refresh).toHaveBeenCalledTimes(1);
    });

    it('keeps the previous allocation when allocating fails', async () => {
      vi.mocked(allocatePrize).mockResolvedValue({
        ok: false,
        data: { code: 'BAD_REQUEST', message: 'Selection is closed' }
      });
      const allocation = { prize: { id: 'prize-1', name: 'Gaming Headset' } };
      renderPage({ participant: buildParticipant({ allocation }) });

      await act(async () => {
        await expect(lastProps().onAllocate({ prize })).rejects.toMatchObject({
          message: 'Selection is closed'
        });
      });

      expect(lastProps().participant?.allocation).toEqual(allocation);
      expect(navigation.router.refresh).not.toHaveBeenCalled();
    });
  });
});
