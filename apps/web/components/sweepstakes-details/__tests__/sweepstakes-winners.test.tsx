import {
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamsProvider } from '@giveaway/team-context/team-provider';
import {
  NOW,
  buildCompletion,
  buildCriteria,
  buildParticipant,
  buildSweepstakesPrize,
  buildSweepstakesPrizeDraw,
  buildTask,
  buildTeam,
  buildUser,
  buildUserProfile
} from '@giveaway/sweepstakes-ui-testing/testing/fixtures';
import { disqualifyDraw } from '@/lib/winners/procedures/disqualify-draw';
import { rerollDraw } from '@/lib/winners/procedures/reroll-draw';
import { rollPrize } from '@/lib/winners/procedures/roll-prize';
import { rollPrizes } from '@/lib/winners/procedures/roll-prizes';
import completeSweepstakes from '@giveaway/sweepstakes-editor-server/complete-sweepstakes';
import updateWinnerCriteria from '@/procedures/sweepstakes/update-winner-criteria';
import { SweepstakesWinners } from '../sweepstakes-winners';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), refresh: vi.fn() }
}));

vi.mock('next/navigation', () => ({ useRouter: () => navigation.router }));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/lib/winners/procedures/roll-prizes', () => ({
  rollPrizes: vi.fn()
}));
vi.mock('@/lib/winners/procedures/roll-prize', () => ({ rollPrize: vi.fn() }));
vi.mock('@/lib/winners/procedures/reroll-draw', () => ({
  rerollDraw: vi.fn()
}));
vi.mock('@/lib/winners/procedures/disqualify-draw', () => ({
  disqualifyDraw: vi.fn()
}));
vi.mock('@giveaway/sweepstakes-editor-server/complete-sweepstakes', () => ({
  default: vi.fn()
}));
vi.mock('@/procedures/sweepstakes/update-winner-criteria', () => ({
  default: vi.fn()
}));

const DAY = 24 * 60 * 60 * 1000;
const ENDED = new Date(NOW.getTime() - DAY);
const RUNNING_UNTIL = new Date(NOW.getTime() + DAY);

const wendy = buildUserProfile({
  id: 'user-1',
  name: 'Wendy Winner',
  email: 'wendy@example.com',
  qualityScore: 95
});
const chad = buildUserProfile({
  id: 'user-2',
  name: 'Chad Cheater',
  email: 'chad@example.com',
  qualityScore: 20
});

const winnerDraw = buildSweepstakesPrizeDraw({
  id: 'draw-1',
  participant: wendy,
  createdAt: new Date(2026, 9, 9, 10, 0),
  taskCompletion: buildCompletion({
    id: 'c-1',
    task: buildTask({ id: 'task-1', title: 'Say hello' })
  })
});

const disqualifiedDraw = buildSweepstakesPrizeDraw({
  id: 'draw-2',
  participant: chad,
  result: 'DISQUALIFIED',
  disqualificationReason: 'Bot activity',
  createdAt: new Date(2026, 9, 9, 9, 0),
  taskCompletion: buildCompletion({
    id: 'c-2',
    task: buildTask({ id: 'task-2', title: 'Visit our site' })
  })
});

const headset = buildSweepstakesPrize({
  id: 'prize-1',
  name: 'Gaming Headset',
  quota: 2,
  draws: [winnerDraw, disqualifiedDraw]
});

const giftCard = buildSweepstakesPrize({
  id: 'prize-2',
  name: 'Gift Card',
  position: 1,
  quota: 1,
  draws: []
});

const completion = buildCompletion();

const participants = [
  buildParticipant({
    id: 'participant-1',
    user: buildUser({ id: 'user-1', qualityScore: 95 }),
    completions: [completion, completion]
  }),
  buildParticipant({
    id: 'participant-2',
    user: buildUser({ id: 'user-2', qualityScore: 20 }),
    completions: [completion]
  }),
  buildParticipant({
    id: 'participant-3',
    user: buildUser({ id: 'user-3', qualityScore: 70 }),
    completions: []
  }),
  buildParticipant({
    id: 'participant-4',
    user: buildUser({ id: 'user-4', qualityScore: 60 }),
    completions: [completion]
  })
];

type WinnersProps = ComponentProps<typeof SweepstakesWinners>;

const team = buildTeam();

const renderWinners = (props: Partial<WinnersProps> = {}) =>
  render(
    <TeamsProvider value={{ activeTeam: team, teams: [team] }}>
      <SweepstakesWinners
        prizes={[headset, giftCard]}
        participants={participants}
        sweepstakesId="sweep-1"
        slug="acme"
        status="EXPIRED"
        endDate={ENDED}
        criteria={buildCriteria({ minTasksCompleted: 1, minQualityScore: 50 })}
        {...props}
      />
    </TeamsProvider>
  );

const criterion = (label: string) =>
  screen.getByText(label).nextElementSibling?.textContent;

const prizeCard = (name: string) =>
  screen.getByText(name).closest('[data-slot="card"]') as HTMLElement;

const completePrizes = [
  buildSweepstakesPrize({ id: 'prize-1', quota: 1, draws: [winnerDraw] })
];

describe('SweepstakesWinners', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('selection criteria', () => {
    it('summarizes the criteria and the number of eligible participants', () => {
      renderWinners();
      expect(criterion('Min Tasks:')).toBe('1');
      expect(criterion('Min Quality:')).toBe('50%');
      expect(criterion('Multiple Wins:')).toBe('No');
      expect(criterion('Prize Selection:')).toBe('No');
      expect(criterion('Eligible:')).toBe('2 / 4');
    });

    it('still counts a participant whose user already won as eligible', () => {
      renderWinners({
        participants: [participants[0]],
        criteria: buildCriteria({ allowMultipleWins: false })
      });
      expect(criterion('Eligible:')).toBe('1 / 1');
    });

    it('excludes a past winner only when the participant id matches the user id', () => {
      renderWinners({
        participants: [{ ...participants[0], id: 'user-1' }],
        criteria: buildCriteria({ allowMultipleWins: false })
      });
      expect(criterion('Eligible:')).toBe('0 / 1');
    });

    it('lists the allowed external sources', () => {
      renderWinners({
        criteria: buildCriteria({
          externalPlatforms: ['TWITTER_IMPORT', 'DISCORD_IMPORT']
        })
      });
      expect(screen.getByText('Allowed Sources:')).toBeInTheDocument();
      expect(screen.getByText('X Import')).toBeInTheDocument();
      expect(screen.getByText('Discord Import')).toBeInTheDocument();
    });

    it('cannot be edited once the sweepstakes is completed', () => {
      renderWinners({ status: 'COMPLETED' });
      expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();
    });
  });

  describe('editing the criteria', () => {
    const openEditor = async () => {
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: 'Edit' }));
      return { user, dialog: screen.getByRole('dialog') };
    };

    it('previews how many participants meet the edited criteria', async () => {
      renderWinners();
      const { user, dialog } = await openEditor();

      expect(dialog).toHaveTextContent(
        '2 of 4 participants meet these criteria'
      );
      fireEvent.change(
        within(dialog).getByLabelText('Minimum Tasks Completed'),
        {
          target: { value: '2' }
        }
      );

      expect(dialog).toHaveTextContent(
        '1 of 4 participants meet these criteria'
      );
      await user.click(
        within(dialog).getByRole('switch', {
          name: 'Allow users to win multiple prizes'
        })
      );
      expect(dialog).toHaveTextContent(
        '1 of 4 participants meet these criteria'
      );
    });

    it('saves the edited criteria and shows the saved values', async () => {
      vi.mocked(updateWinnerCriteria).mockResolvedValue({
        ok: true,
        data: {
          minTasksCompleted: 2,
          minQualityScore: 75,
          allowMultipleWins: true,
          allowUserSelection: false,
          externalPlatforms: null
        }
      });
      renderWinners();
      const { user, dialog } = await openEditor();

      fireEvent.change(
        within(dialog).getByLabelText('Minimum Tasks Completed'),
        {
          target: { value: '2' }
        }
      );
      await user.click(within(dialog).getByRole('radio', { name: 'Maximum' }));
      await user.click(
        within(dialog).getByRole('switch', {
          name: 'Allow users to win multiple prizes'
        })
      );
      await user.click(
        within(dialog).getByRole('button', { name: 'Save Changes' })
      );

      expect(updateWinnerCriteria).toHaveBeenCalledWith({
        sweepstakesId: 'sweep-1',
        slug: 'acme',
        minTasksCompleted: 2,
        minQualityScore: 75,
        allowMultipleWins: true,
        allowUserSelection: false,
        externalPlatforms: null
      });
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      );
      expect(criterion('Min Tasks:')).toBe('2');
      expect(criterion('Min Quality:')).toBe('75%');
      expect(criterion('Multiple Wins:')).toBe('Yes');
      expect(navigation.router.refresh).toHaveBeenCalledTimes(1);
    });

    it('snaps an emptied minimum back to one task so typing appends to it', async () => {
      renderWinners();
      const { user, dialog } = await openEditor();
      const minTasks = within(dialog).getByLabelText('Minimum Tasks Completed');
      await user.clear(minTasks);
      expect(minTasks).toHaveValue(1);
      await user.type(minTasks, '2');
      expect(minTasks).toHaveValue(12);
    });

    it('snaps a quality score between enforcement levels to the nearest level', async () => {
      vi.mocked(updateWinnerCriteria).mockReturnValue(new Promise(() => {}));
      renderWinners({ criteria: buildCriteria({ minQualityScore: 70 }) });
      const { user, dialog } = await openEditor();

      await user.click(
        within(dialog).getByRole('button', { name: 'Save Changes' })
      );

      expect(vi.mocked(updateWinnerCriteria).mock.lastCall?.[0]).toMatchObject({
        minQualityScore: 75
      });
    });

    it('discards the edits when cancelled', async () => {
      renderWinners();
      const { user, dialog } = await openEditor();
      await user.click(
        within(dialog).getByRole('switch', {
          name: 'Allow participants to select prizes'
        })
      );
      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
      await user.click(screen.getByRole('button', { name: 'Edit' }));

      expect(
        within(screen.getByRole('dialog')).getByRole('switch', {
          name: 'Allow participants to select prizes'
        })
      ).not.toBeChecked();
      expect(updateWinnerCriteria).not.toHaveBeenCalled();
    });
  });

  describe('before the giveaway ends', () => {
    it('explains that winners can only be picked afterwards', () => {
      renderWinners({ prizes: [giftCard], endDate: RUNNING_UNTIL });
      expect(
        screen.getByText('Winners Can Only Be Selected After Giveaway Ends')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Pick All Winners' })
      ).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Roll with public picker' })
      ).toBeDisabled();
      expect(
        screen.queryByRole('button', { name: 'Pick Winner' })
      ).not.toBeInTheDocument();
    });
  });

  describe('without winners', () => {
    it('offers to pick every winner once the giveaway ended', () => {
      renderWinners({ prizes: [giftCard, { ...giftCard, id: 'prize-3' }] });
      expect(screen.getByText('No winners selected yet')).toBeInTheDocument();
      expect(
        screen.getByText('Ready to select winners for 2 prizes')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('Important: Contact Winners')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('Winners Can Only Be Selected After Giveaway Ends')
      ).not.toBeInTheDocument();
    });

    it('rolls every prize and refreshes the page', async () => {
      const user = userEvent.setup();
      vi.mocked(rollPrizes).mockResolvedValue({
        ok: true,
        data: { success: true }
      });
      renderWinners({ prizes: [giftCard] });

      await user.click(
        screen.getByRole('button', { name: 'Pick All Winners' })
      );

      expect(rollPrizes).toHaveBeenCalledWith({
        sweepstakesId: 'sweep-1',
        slug: 'acme'
      });
      await waitFor(() =>
        expect(navigation.router.refresh).toHaveBeenCalledTimes(1)
      );
    });

    it('shows that winners are being rolled', async () => {
      const user = userEvent.setup();
      vi.mocked(rollPrizes).mockReturnValue(new Promise(() => {}));
      renderWinners({ prizes: [giftCard] });

      await user.click(
        screen.getByRole('button', { name: 'Pick All Winners' })
      );

      expect(
        (await screen.findAllByRole('button', { name: /Rolling\.\.\./ }))[0]
      ).toBeDisabled();
    });

    it('opens the public picker', async () => {
      const user = userEvent.setup();
      renderWinners({ prizes: [giftCard] });
      await user.click(
        screen.getByRole('button', { name: 'Roll with public picker' })
      );
      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/acme/sweepstakes/sweep-1/winners/public'
      );
    });

    it('rolls a single prize from its empty state', async () => {
      const user = userEvent.setup();
      vi.mocked(rollPrize).mockReturnValue(new Promise(() => {}));
      renderWinners({ prizes: [giftCard] });

      const card = prizeCard('Gift Card');
      expect(card).toHaveTextContent('No draws yet for this prize');
      await user.click(
        within(card).getByRole('button', { name: 'Pick Winner' })
      );

      expect(rollPrize).toHaveBeenCalledWith({
        sweepstakesId: 'sweep-1',
        slug: 'acme',
        prizeId: 'prize-2'
      });
    });
  });

  describe('with some winners', () => {
    it('asks the host to contact the winners', () => {
      renderWinners();
      expect(
        screen.getByText('Important: Contact Winners')
      ).toBeInTheDocument();
    });

    it('counts the incomplete prizes', () => {
      renderWinners();
      expect(screen.getByText('2 prizes incomplete')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Pick Remaining Winners' })
      ).toBeEnabled();
    });
  });

  describe('with every winner picked', () => {
    it('offers to complete the sweepstakes', async () => {
      const user = userEvent.setup();
      vi.mocked(completeSweepstakes).mockResolvedValue({
        ok: true,
        data: { success: true }
      });
      renderWinners({ prizes: completePrizes });

      expect(screen.getByText('All winners selected')).toBeInTheDocument();
      await user.click(
        screen.getByRole('button', { name: 'Mark as Completed' })
      );
      await user.click(
        within(screen.getByRole('alertdialog')).getByRole('button', {
          name: 'Yes, Complete Sweepstakes'
        })
      );

      expect(completeSweepstakes).toHaveBeenCalledWith({
        sweepstakesId: 'sweep-1',
        slug: 'acme'
      });
      await waitFor(() =>
        expect(navigation.router.push).toHaveBeenCalledWith('/app/acme')
      );
    });

    it('does not offer completion for a completed sweepstakes', () => {
      renderWinners({ prizes: completePrizes, status: 'COMPLETED' });
      expect(
        screen.queryByRole('button', { name: 'Mark as Completed' })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Open public picker' })
      ).toBeEnabled();
    });

    it('marks the prize as complete', () => {
      renderWinners({ prizes: completePrizes });
      const card = prizeCard('Gaming Headset');
      expect(card).toHaveTextContent('1 / 1 winner selected');
      expect(within(card).getByText('Complete')).toBeInTheDocument();
    });
  });

  describe('prize draws', () => {
    it('lists the draws of a prize from oldest to newest', () => {
      renderWinners();
      const card = prizeCard('Gaming Headset');
      expect(card).toHaveTextContent('1 / 2 winners selected');
      const rows = within(card).getAllByRole('row').slice(1);
      expect(rows.map((row) => row.textContent)).toEqual([
        '#1Chad Cheaterc***d@example.comVisit our siteBonusBannedDisqualified',
        '#2Wendy Winnerw***y@example.comSay helloBonusTrustedWinner'
      ]);
    });

    it('groups draws of prizes that share an id', () => {
      renderWinners({
        prizes: [
          buildSweepstakesPrize({
            id: 'prize-1',
            quota: 2,
            draws: [winnerDraw]
          }),
          buildSweepstakesPrize({
            id: 'prize-1',
            quota: 2,
            draws: [disqualifiedDraw]
          })
        ]
      });
      expect(screen.getAllByText('Gaming Headset')).toHaveLength(1);
      expect(
        within(prizeCard('Gaming Headset')).getAllByRole('row')
      ).toHaveLength(3);
    });

    it('opens the winner details', async () => {
      const user = userEvent.setup();
      renderWinners();
      await user.click(screen.getByRole('button', { name: /Wendy Winner/ }));
      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/acme/sweepstakes/sweep-1/winners/user/user-1'
      );
    });

    it('opens the details of the winning task completion', async () => {
      const user = userEvent.setup();
      renderWinners();
      await user.click(screen.getByRole('button', { name: /Say hello/ }));
      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/acme/sweepstakes/sweep-1/winners/task/task-1?active=c-1'
      );
    });

    it('locks the winner actions when the sweepstakes is completed', () => {
      renderWinners({ status: 'COMPLETED' });
      const winnerRow = screen
        .getByText('Wendy Winner')
        .closest('tr') as HTMLElement;
      const actions = within(winnerRow).getAllByRole('button').at(-1);
      expect(actions).toBeDisabled();
    });
  });

  describe('winner actions', () => {
    const openWinnerAction = async (action: 'Disqualify' | 'Re-roll') => {
      const user = userEvent.setup();
      const winnerRow = screen
        .getByText('Wendy Winner')
        .closest('tr') as HTMLElement;
      await user.click(
        within(winnerRow).getAllByRole('button').at(-1) as HTMLElement
      );
      await user.click(screen.getByRole('menuitem', { name: action }));
      return { user, dialog: screen.getByRole('dialog') };
    };

    it('disqualifies a winner with a reason', async () => {
      vi.mocked(disqualifyDraw).mockReturnValue(new Promise(() => {}));
      renderWinners();
      const { user, dialog } = await openWinnerAction('Disqualify');

      expect(dialog).toHaveAccessibleName('Disqualify User');
      const submit = within(dialog).getByRole('button', { name: 'Disqualify' });
      expect(submit).toBeDisabled();

      await user.type(
        within(dialog).getByLabelText('Disqualification Reason *'),
        'Did not respond'
      );
      await user.click(submit);

      expect(disqualifyDraw).toHaveBeenCalledWith({
        sweepstakesId: 'sweep-1',
        slug: 'acme',
        drawId: 'draw-1',
        disqualificationReason: 'Did not respond'
      });
      expect(rerollDraw).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('re-rolls a winner with a reason', async () => {
      vi.mocked(rerollDraw).mockReturnValue(new Promise(() => {}));
      renderWinners();
      const { user, dialog } = await openWinnerAction('Re-roll');

      expect(dialog).toHaveAccessibleName('Disqualify & Re-roll');
      await user.type(
        within(dialog).getByLabelText('Disqualification Reason *'),
        'Duplicate account'
      );
      await user.click(
        within(dialog).getByRole('button', { name: 'Disqualify & Re-roll' })
      );

      expect(rerollDraw).toHaveBeenCalledWith({
        sweepstakesId: 'sweep-1',
        slug: 'acme',
        drawId: 'draw-1',
        disqualificationReason: 'Duplicate account'
      });
      expect(disqualifyDraw).not.toHaveBeenCalled();
    });

    it('shows the reason of a disqualified draw', async () => {
      const user = userEvent.setup();
      renderWinners();
      const row = screen.getByText('Chad Cheater').closest('tr') as HTMLElement;
      await user.click(
        within(row).getAllByRole('button').at(-1) as HTMLElement
      );
      await user.click(screen.getByRole('menuitem', { name: 'View Reason' }));

      const dialog = screen.getByRole('dialog', {
        name: 'Disqualification Details'
      });
      expect(dialog).toHaveTextContent('Chad Cheater');
      expect(dialog).toHaveTextContent('Bot activity');
      expect(dialog).toHaveTextContent(
        new Date(2026, 9, 9, 9, 0).toLocaleString()
      );
    });
  });
});
