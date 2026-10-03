import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  buildGiveawayPrize,
  buildParticipant,
  buildPrizeDraw,
  buildUser,
  buildUserProfile
} from '@/components/sweepstakes/__tests__/fixtures';
import { renderWithParticipation } from '@/components/sweepstakes/__tests__/participation-fixtures';
import type { GiveawayParticipationProps } from '@/components/sweepstakes/giveaway-participation-context';
import { UNKNOWN_USER_NAME } from '@giveaway/app-config/settings';
import { WinnersAnnounced } from '../winners-announced';

const me = buildUser({ id: 'user-me', name: 'Me Myself' });
const winner = buildUserProfile({ id: 'user-winner', name: 'Wendy Winner' });
const cheater = buildUserProfile({ id: 'user-cheater', name: 'Chad Cheater' });

const headset = buildGiveawayPrize({
  prizeId: 'prize-1',
  prizeName: 'Gaming Headset',
  quota: 2,
  draws: [
    buildPrizeDraw({ id: 'draw-1', user: winner }),
    buildPrizeDraw({
      id: 'draw-2',
      user: cheater,
      result: 'DISQUALIFIED',
      disqualificationReason: 'Used multiple accounts',
      task: { id: 'task-2', type: 'VISIT_URL', title: 'Visit our site' }
    })
  ]
});

const giftCard = buildGiveawayPrize({
  prizeId: 'prize-2',
  prizeName: 'Gift Card',
  quota: 3,
  draws: [
    buildPrizeDraw({ id: 'draw-3', user: winner }),
    buildPrizeDraw({ id: 'draw-4', user: buildUserProfile({ id: 'user-4' }) })
  ]
});

const renderWinners = (overrides: Partial<GiveawayParticipationProps> = {}) =>
  renderWithParticipation(<WinnersAnnounced />, {
    state: 'winners-announced',
    prizes: [headset, giftCard],
    ...overrides
  });

const participantWithAllocation = (prizeId: string, prizeName: string) =>
  buildParticipant({
    user: me,
    allocation: { prize: { id: prizeId, name: prizeName } }
  });

describe('WinnersAnnounced', () => {
  it('announces the winners', () => {
    renderWinners();
    expect(
      screen.getByRole('heading', { name: 'Winners Announced!' })
    ).toBeInTheDocument();
  });

  describe('participant result', () => {
    it('does not show a result for a visitor', () => {
      renderWinners();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('does not show a result for a participant without an allocated prize', () => {
      renderWinners({ participant: buildParticipant({ user: me }) });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('does not show a result when the allocated prize is not in the list', () => {
      renderWinners({
        participant: participantWithAllocation('prize-9', 'Mystery Box')
      });
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('congratulates a participant who won the allocated prize', () => {
      renderWinners({
        prizes: [
          buildGiveawayPrize({
            draws: [buildPrizeDraw({ user: buildUserProfile({ id: me.id }) })]
          })
        ],
        participant: participantWithAllocation('prize-1', 'Gaming Headset')
      });
      expect(screen.getByRole('alert')).toHaveTextContent(
        '🎉 Congratulations! You won Gaming Headset!'
      );
    });

    it('tells a participant who was not drawn that they competed', () => {
      renderWinners({
        participant: participantWithAllocation('prize-1', 'Gaming Headset')
      });
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('You competed for Gaming Headset');
      expect(alert).toHaveTextContent(
        "Unfortunately, you didn't win this time. Better luck next time!"
      );
    });

    it('shows the reason when the participant was disqualified', () => {
      renderWinners({
        prizes: [
          buildGiveawayPrize({
            draws: [
              buildPrizeDraw({
                user: buildUserProfile({ id: me.id }),
                result: 'DISQUALIFIED',
                disqualificationReason: 'Bot activity'
              })
            ]
          })
        ],
        participant: participantWithAllocation('prize-1', 'Gaming Headset')
      });
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(
        'You were disqualified from Gaming Headset'
      );
      expect(alert).toHaveTextContent('Reason: Bot activity');
      expect(alert).toHaveClass('text-destructive');
    });

    it('omits the reason line when a disqualification has no reason', () => {
      renderWinners({
        prizes: [
          buildGiveawayPrize({
            draws: [
              buildPrizeDraw({
                user: buildUserProfile({ id: me.id }),
                result: 'DISQUALIFIED',
                disqualificationReason: null
              })
            ]
          })
        ],
        participant: participantWithAllocation('prize-1', 'Gaming Headset')
      });
      expect(screen.getByRole('alert')).not.toHaveTextContent('Reason:');
    });
  });

  describe('prize list', () => {
    it('summarizes the winners and disqualifications of every prize', () => {
      renderWinners();
      const headsetButton = screen.getByRole('button', {
        name: /Gaming Headset/
      });
      expect(headsetButton).toHaveTextContent('1 winner');
      expect(headsetButton).toHaveTextContent('1 disqualified');
      const giftCardButton = screen.getByRole('button', { name: /Gift Card/ });
      expect(giftCardButton).toHaveTextContent('2 winners');
      expect(giftCardButton).not.toHaveTextContent('disqualified');
    });

    it('says 0 winners for a prize without draws', () => {
      renderWinners({ prizes: [buildGiveawayPrize({ draws: [] })] });
      expect(
        screen.getByRole('button', { name: /Gaming Headset/ })
      ).toHaveTextContent('0 winners');
    });

    it('keeps the prize collapsed until it is clicked', () => {
      renderWinners();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('lists winners before disqualified participants when expanded', async () => {
      const user = userEvent.setup();
      renderWinners();
      await user.click(screen.getByRole('button', { name: /Gaming Headset/ }));

      const rows = within(screen.getByRole('table')).getAllByRole('row');
      expect(rows.map((row) => row.textContent)).toEqual([
        'NameWon ViaStatus',
        'Wendy WinnerSay helloWinner',
        'Chad CheaterVisit our siteDisqualified'
      ]);
    });

    it('collapses an expanded prize when clicked again', async () => {
      const user = userEvent.setup();
      renderWinners();
      const trigger = screen.getByRole('button', { name: /Gaming Headset/ });
      await user.click(trigger);
      await user.click(trigger);
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('falls back to placeholders for missing names and task titles', async () => {
      const user = userEvent.setup();
      renderWinners({
        prizes: [
          buildGiveawayPrize({
            draws: [
              buildPrizeDraw({
                user: buildUserProfile({ name: null }),
                task: { id: 'task-1', type: 'BONUS_TASK', title: '' }
              })
            ]
          })
        ]
      });
      await user.click(screen.getByRole('button', { name: /Gaming Headset/ }));
      const cells = within(screen.getByRole('table')).getAllByRole('cell');
      expect(cells[0]).toHaveTextContent(UNKNOWN_USER_NAME);
      expect(cells[1]).toHaveTextContent('N/A');
    });

    it('shows the disqualification reason in a dialog', async () => {
      const user = userEvent.setup();
      renderWinners();
      await user.click(screen.getByRole('button', { name: /Gaming Headset/ }));
      await user.click(screen.getByRole('button', { name: 'Disqualified' }));

      const dialog = screen.getByRole('dialog', {
        name: 'Disqualification Details'
      });
      expect(dialog).toHaveTextContent('Chad Cheater');
      expect(dialog).toHaveTextContent('Used multiple accounts');
      expect(screen.getByRole('table', { hidden: true })).toBeInTheDocument();
    });
  });
});
