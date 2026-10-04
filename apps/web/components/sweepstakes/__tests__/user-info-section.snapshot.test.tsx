import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import logout from '@giveaway/auth-actions/logout';
import { UserInfoSection } from '../user-info-section';
import {
  buildParticipant,
  buildProvider,
  buildUser
} from '@giveaway/sweepstakes-ui-testing/testing/fixtures';
import { renderWithParticipation } from './participation-fixtures';
import type { ProviderSchema } from '@giveaway/integration-model/providers';

const navigation = vi.hoisted(() => ({ pathname: '/browse/summer-giveaway' }));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname
}));

vi.mock('@giveaway/auth-actions/logout', () => ({ default: vi.fn() }));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const PROVIDER_TYPES: ProviderSchema['type'][] = [
  'TWITTER',
  'GOOGLE',
  'DISCORD',
  'TWITCH',
  'STEAM',
  'KICK'
];

const providers = (count: number) =>
  PROVIDER_TYPES.slice(0, count).map((type) =>
    buildProvider({ type, label: type.toLowerCase() })
  );

describe('UserInfoSection', () => {
  beforeEach(() => {
    navigation.pathname = '/browse/summer-giveaway';
    vi.mocked(logout).mockReset();
    vi.mocked(toast.success).mockReset();
  });

  describe('when nobody is signed in', () => {
    it('matches the snapshot', () => {
      const { container } = renderWithParticipation(<UserInfoSection />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('when a participant is signed in', () => {
    it('matches the snapshot', () => {
      const { container } = renderWithParticipation(<UserInfoSection />, {
        participant: buildParticipant({
          user: buildUser({ providers: providers(2) })
        })
      });
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
