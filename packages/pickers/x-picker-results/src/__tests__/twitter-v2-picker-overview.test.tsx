import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PickerStatus } from '@giveaway/db-model';
import { TwitterV2PickerSchema } from '@giveaway/x-picker-model/schemas/details';
import { drawTwitterV2Picker } from '@giveaway/x-picker-server/procedures/draw-twitter-v2-picker';
import { disqualifyTwitterV2Winner } from '@giveaway/x-picker-server/procedures/disqualify-twitter-v2-winner';
import { deleteTwitterV2Picker } from '@giveaway/x-picker-server/procedures/delete-twitter-v2-picker';
import { TwitterV2PickerOverview } from '../twitter-v2-picker-overview';

const refresh = vi.fn();
const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh, push })
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@giveaway/x-picker-server/procedures/draw-twitter-v2-picker', () => ({
  drawTwitterV2Picker: vi.fn()
}));
vi.mock(
  '@giveaway/x-picker-server/procedures/disqualify-twitter-v2-winner',
  () => ({ disqualifyTwitterV2Winner: vi.fn() })
);
vi.mock(
  '@giveaway/x-picker-server/procedures/delete-twitter-v2-picker',
  () => ({ deleteTwitterV2Picker: vi.fn() })
);

const NO_ELIGIBLE_USER =
  'All eligible users have already been drawn as winners';

const date = new Date('2026-01-01T00:00:00.000Z');

const picker: TwitterV2PickerSchema = {
  id: 'picker-1',
  runId: null,
  teamId: 'team-1',
  tweetUrls: ['https://x.com/someone/status/1234567890'],
  status: PickerStatus.COMPLETE,
  winners: 1,
  minPostCount: null,
  minAccountAgeDays: null,
  minFollowersCount: null,
  minFollowingCount: null,
  requireProfileImage: null,
  requireBannerImage: null,
  requireLocation: null,
  requireBio: null,
  runAt: null,
  createdAt: date,
  updatedAt: date,
  users: [
    {
      id: 'user-1',
      userId: '1',
      username: 'only_user',
      name: 'Only User',
      description: null,
      url: null,
      location: null,
      profileImageUrl: null,
      bannerImageUrl: null,
      createdAt: date,
      canDm: null,
      followersCount: 10,
      followingCount: 10,
      tweetCount: 10,
      verified: false
    }
  ],
  draws: [
    {
      id: 'draw-1',
      userId: 'user-1',
      disqualified: null,
      createdAt: date,
      updatedAt: date
    }
  ],
  tweets: [],
  stats: {
    totalParticipants: 1,
    sampleSize: 1,
    eligibleInSample: 1,
    estimatedEligible: 1
  }
};

const failure = (message: string) => ({
  ok: false as const,
  data: { code: 'BAD_REQUEST' as const, message }
});

describe('TwitterV2PickerOverview', () => {
  beforeEach(() => {
    refresh.mockClear();
    push.mockClear();
    vi.mocked(toast.error).mockClear();
    vi.mocked(drawTwitterV2Picker).mockReset();
    vi.mocked(disqualifyTwitterV2Winner).mockReset();
    vi.mocked(deleteTwitterV2Picker).mockReset();
  });

  it('shows why nothing was drawn when no eligible user is left for an extra draw', async () => {
    vi.mocked(drawTwitterV2Picker).mockResolvedValue(failure(NO_ELIGIBLE_USER));
    const user = userEvent.setup();
    render(<TwitterV2PickerOverview picker={picker} slug="team" />);

    await user.click(screen.getByRole('button', { name: 'Draw Extra' }));
    await user.click(screen.getByRole('button', { name: 'Confirm Draw' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(NO_ELIGIBLE_USER)
    );
    expect(drawTwitterV2Picker).toHaveBeenCalledWith({
      pickerId: 'picker-1',
      slug: 'team',
      count: 1
    });
  });

  it('shows no error when the extra draw succeeds', async () => {
    vi.mocked(drawTwitterV2Picker).mockResolvedValue({ ok: true, data: [] });
    const user = userEvent.setup();
    render(<TwitterV2PickerOverview picker={picker} slug="team" />);

    await user.click(screen.getByRole('button', { name: 'Draw Extra' }));
    await user.click(screen.getByRole('button', { name: 'Confirm Draw' }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('shows why no new winner was drawn after a re-roll', async () => {
    vi.mocked(disqualifyTwitterV2Winner).mockResolvedValue({
      ok: true,
      data: { success: true }
    });
    vi.mocked(drawTwitterV2Picker).mockResolvedValue(failure(NO_ELIGIBLE_USER));
    const user = userEvent.setup();
    render(<TwitterV2PickerOverview picker={picker} slug="team" />);

    await user.click(screen.getByRole('button', { name: /re-roll/i }));
    const dialog = screen.getByRole('dialog');
    await user.type(
      within(dialog).getByLabelText('Reason for disqualification'),
      'Bot account'
    );
    await user.click(
      within(dialog).getByRole('button', { name: /disqualify/i })
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(NO_ELIGIBLE_USER)
    );
    expect(disqualifyTwitterV2Winner).toHaveBeenCalledWith({
      drawId: 'draw-1',
      slug: 'team',
      reason: 'Bot account'
    });
    expect(refresh).toHaveBeenCalled();
  });

  it('shows the error of a failed disqualification and draws no new winner', async () => {
    vi.mocked(disqualifyTwitterV2Winner).mockResolvedValue(
      failure('Draw not found')
    );
    const user = userEvent.setup();
    render(<TwitterV2PickerOverview picker={picker} slug="team" />);

    await user.click(screen.getByRole('button', { name: /re-roll/i }));
    const dialog = screen.getByRole('dialog');
    await user.type(
      within(dialog).getByLabelText('Reason for disqualification'),
      'Bot account'
    );
    await user.click(
      within(dialog).getByRole('button', { name: /disqualify/i })
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Draw not found')
    );
    expect(drawTwitterV2Picker).not.toHaveBeenCalled();
  });

  it('hides Edit Picker in the actions menu of a completed picker', async () => {
    const user = userEvent.setup();
    render(<TwitterV2PickerOverview picker={picker} slug="team" />);

    await user.click(screen.getByRole('button', { name: 'Picker actions' }));

    expect(
      await screen.findByRole('menuitem', { name: 'Delete Picker' })
    ).toBeVisible();
    expect(
      screen.queryByRole('menuitem', { name: 'Edit Picker' })
    ).not.toBeInTheDocument();
  });

  it('links Edit Picker to the editor of a picker that is still editable', async () => {
    const user = userEvent.setup();
    render(
      <TwitterV2PickerOverview
        picker={{ ...picker, status: PickerStatus.PROCESSED, draws: [] }}
        slug="team"
      />
    );

    await user.click(screen.getByRole('button', { name: 'Picker actions' }));

    expect(
      await screen.findByRole('menuitem', { name: 'Edit Picker' })
    ).toHaveAttribute('href', '/app/team/pickers/x/picker-1/edit');
  });
});
