import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildAgeField,
  buildAudience,
  buildEmailField,
  buildSweepstakes,
  buildTwitterField,
  buildUsernameField,
  withStableIds
} from '@giveaway/sweepstakes-ui-testing/testing/fixtures';
import { renderWithParticipation } from '@/components/sweepstakes/__tests__/participation-fixtures';
import type { GiveawayParticipationProps } from '@/components/sweepstakes/giveaway-participation-context';
import type { SweepstakesFormFieldSchema } from '@giveaway/custom-fields-model/schemas';
import { UserDetailsForm } from '../user-details-form';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), refresh: vi.fn() }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  usePathname: () => '/browse/summer-giveaway'
}));

vi.mock('@giveaway/auth-actions/logout', () => ({ default: vi.fn() }));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const AGE_LABEL = 'I am at least 18 years of age (required)';

const allFields: SweepstakesFormFieldSchema[] = [
  buildUsernameField({ placeholder: 'Pick a username' }),
  buildEmailField(),
  buildAgeField({ minimum: 18, label: AGE_LABEL }),
  buildTwitterField()
];

const renderForm = (
  formFields: SweepstakesFormFieldSchema[],
  overrides: Partial<GiveawayParticipationProps> = {}
) =>
  renderWithParticipation(<UserDetailsForm />, {
    state: 'profile-incomplete',
    sweepstakes: buildSweepstakes({ audience: buildAudience({ formFields }) }),
    ...overrides
  });

describe('UserDetailsForm', () => {
  beforeEach(() => {
    navigation.router.refresh.mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it('matches the snapshot for a visitor with every field type', () => {
    const { container } = renderForm(allFields);
    expect(withStableIds(container)).toMatchSnapshot();
  });
});
