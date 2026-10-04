import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { GiveawayParticipationProps } from '../giveaway-participation-context';
import { GiveawayParticipationCard } from '../giveaway-participation-card';
import { NOW, buildHost, withStableIds } from './fixtures';
import { renderWithParticipation } from './participation-fixtures';
import type { DeviceType } from '@giveaway/sweepstakes-model/schemas';

const socialHost = buildHost({
  links: [
    { platform: 'x', url: 'https://x.com/acme' },
    { platform: 'discord', url: 'https://discord.gg/acme' }
  ]
});

const renderCard = (
  overrides: Partial<GiveawayParticipationProps> = {},
  device?: DeviceType
) =>
  renderWithParticipation(
    <GiveawayParticipationCard device={device}>
      <p>state content</p>
    </GiveawayParticipationCard>,
    { host: socialHost, ...overrides }
  );

describe('GiveawayParticipationCard', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('matches the snapshot', () => {
    const { container } = renderCard();
    expect(withStableIds(container)).toMatchSnapshot();
  });
});
