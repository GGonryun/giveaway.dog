import { describe, expect, it } from 'vitest';
import {
  buildGiveawayPrize,
  buildParticipant,
  buildPrizeDraw,
  buildUser,
  buildUserProfile,
  withStableIds
} from '@/components/sweepstakes/__tests__/fixtures';
import { renderWithParticipation } from '@/components/sweepstakes/__tests__/participation-fixtures';
import type { GiveawayParticipationProps } from '@/components/sweepstakes/giveaway-participation-context';
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
  it('matches the snapshot for a participant who won', () => {
    const { container } = renderWinners({
      prizes: [
        buildGiveawayPrize({
          draws: [buildPrizeDraw({ user: buildUserProfile({ id: me.id }) })]
        })
      ],
      participant: participantWithAllocation('prize-1', 'Gaming Headset')
    });
    expect(withStableIds(container)).toMatchSnapshot();
  });
});
