import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildCompletion,
  buildParticipant,
  buildUser,
  withStableIds
} from '@/components/sweepstakes/__tests__/fixtures';
import { disqualifyParticipant } from '@/procedures/sweepstakes/disqualify-participant';
import { SweepstakesParticipants } from '../sweepstakes-participants';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn(), refresh: vi.fn() }
}));

vi.mock('next/navigation', () => ({ useRouter: () => navigation.router }));

vi.mock('@/procedures/sweepstakes/disqualify-participant', () => ({
  disqualifyParticipant: vi.fn()
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const jane = buildParticipant({
  id: 'participant-1',
  user: buildUser({ id: 'user-1', name: 'Jane Doe', qualityScore: 95 }),
  completions: [
    buildCompletion({ id: 'c-1', completedAt: new Date(2026, 8, 28, 15, 45) }),
    buildCompletion({ id: 'c-2', completedAt: new Date(2026, 8, 30, 9, 5) })
  ]
});

const lurker = buildParticipant({
  id: 'participant-2',
  user: buildUser({
    id: 'user-2',
    name: null,
    email: 'lurker@example.com',
    qualityScore: 20
  }),
  completions: []
});

const renderParticipants = (participants = [jane, lurker], totalTasks = 4) =>
  render(
    <SweepstakesParticipants
      slug="acme"
      sweepstakesId="sweep-1"
      totalTasks={totalTasks}
      participants={participants}
    />
  );

const bodyRows = () => screen.getAllByRole('row').slice(1);

const openActions = async (rowIndex: number) => {
  const user = userEvent.setup();
  const row = bodyRows()[rowIndex];
  await user.click(within(row).getByRole('button'));
  return user;
};

describe('SweepstakesParticipants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('matches the snapshot', () => {
    const { container } = renderParticipants();
    expect(withStableIds(container)).toMatchSnapshot();
  });

  it('renders the participant columns', () => {
    renderParticipants();
    expect(
      screen.getAllByRole('columnheader').map((cell) => cell.textContent)
    ).toEqual(['User', 'Quality', 'Engagement', 'Last Entry', '']);
  });

  describe('rows', () => {
    it('shows the name, quality, engagement and last entry of a participant', () => {
      renderParticipants();
      const row = bodyRows()[0];
      expect(within(row).getByText('Jane Doe')).toBeInTheDocument();
      expect(within(row).getByText('j***e@example.com')).toBeInTheDocument();
      expect(within(row).getByText('Trusted')).toBeInTheDocument();
      expect(within(row).getByText('50%')).toBeInTheDocument();
      expect(within(row).getByText('Sep 30, 09:05 AM')).toBeInTheDocument();
    });

    it('fills the engagement bar with a color for the engagement', () => {
      renderParticipants();
      const bar = within(bodyRows()[0]).getByText('50%').previousElementSibling
        ?.firstElementChild as HTMLElement;
      expect(bar).toHaveStyle({ width: '50%' });
      expect(bar).toHaveClass('bg-yellow-500');
    });

    it('shows a dash and no engagement for a participant without entries', () => {
      renderParticipants();
      const row = bodyRows()[1];
      expect(within(row).getByText('—')).toBeInTheDocument();
      expect(within(row).getByText('0%')).toBeInTheDocument();
      expect(within(row).getByText('Banned')).toBeInTheDocument();
    });

    it('reports zero engagement when the sweepstakes has no tasks', () => {
      renderParticipants([jane], 0);
      expect(within(bodyRows()[0]).getByText('0%')).toBeInTheDocument();
    });

    it('opens the quick view of a clicked participant', async () => {
      const user = userEvent.setup();
      renderParticipants();
      await user.click(within(bodyRows()[0]).getByText('Jane Doe'));
      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/acme/sweepstakes/sweep-1/participants/user-1'
      );
    });
  });

  describe('pagination', () => {
    const many = Array.from({ length: 12 }, (_, index) =>
      buildParticipant({
        id: `participant-${index}`,
        user: buildUser({ id: `user-${index}`, name: `User ${index}` })
      })
    );

    it('shows ten participants per page', () => {
      renderParticipants(many);
      expect(bodyRows()).toHaveLength(10);
      expect(screen.getByText(/1-10 of 12/)).toBeInTheDocument();
    });

    it('shows the remaining participants on the next page', async () => {
      const user = userEvent.setup();
      renderParticipants(many);
      await user.click(screen.getByRole('button', { name: 'Next page' }));
      expect(
        bodyRows().map((row) => within(row).getByText(/User/).textContent)
      ).toEqual(['User 10', 'User 11']);
    });
  });

  describe('actions', () => {
    it('opens the full user details', async () => {
      renderParticipants();
      const user = await openActions(0);
      await user.click(
        screen.getByRole('menuitem', { name: 'View Full Details' })
      );
      expect(navigation.router.push).toHaveBeenCalledTimes(1);
      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/acme/users/user-1'
      );
    });

    it('opens the quick view', async () => {
      renderParticipants();
      const user = await openActions(0);
      await user.click(screen.getByRole('menuitem', { name: 'Quick View' }));
      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/acme/sweepstakes/sweep-1/participants/user-1'
      );
    });
  });

  describe('disqualifying', () => {
    const openDisqualify = async (rowIndex = 0) => {
      const user = await openActions(rowIndex);
      await user.click(
        screen.getByRole('menuitem', { name: 'Disqualify Participant' })
      );
      return { user, dialog: screen.getByRole('dialog') };
    };

    it('asks for a reason before disqualifying the participant', async () => {
      renderParticipants();
      const { dialog } = await openDisqualify();
      expect(dialog).toHaveAccessibleName('Disqualify Participant');
      expect(dialog).toHaveTextContent(
        'This will reject all task completions for Jane Doe in this sweepstakes.'
      );
      expect(
        within(dialog).getByRole('button', { name: 'Disqualify Participant' })
      ).toBeDisabled();
    });

    it('names a participant without a name as an unknown user', async () => {
      renderParticipants();
      const { dialog } = await openDisqualify(1);
      expect(dialog).toHaveTextContent(
        'reject all task completions for Unknown User'
      );
    });

    it('disqualifies the participant with the reason and refreshes', async () => {
      vi.mocked(disqualifyParticipant).mockResolvedValue({
        ok: true,
        data: { success: true }
      });
      renderParticipants();
      const { user, dialog } = await openDisqualify();

      await user.type(
        within(dialog).getByLabelText('Disqualification Reason (required)'),
        'Bot activity'
      );
      await user.click(
        within(dialog).getByRole('button', { name: 'Disqualify Participant' })
      );

      expect(disqualifyParticipant).toHaveBeenCalledWith({
        sweepstakesId: 'sweep-1',
        participantId: 'participant-1',
        disqualificationReason: 'Bot activity'
      });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      await waitFor(() =>
        expect(navigation.router.refresh).toHaveBeenCalledTimes(1)
      );
    });

    it('keeps the button disabled for a blank reason', async () => {
      renderParticipants();
      const { user, dialog } = await openDisqualify();
      await user.type(
        within(dialog).getByLabelText('Disqualification Reason (required)'),
        '   '
      );
      expect(
        within(dialog).getByRole('button', { name: 'Disqualify Participant' })
      ).toBeDisabled();
    });

    it('closes without disqualifying when cancelled', async () => {
      renderParticipants();
      const { user, dialog } = await openDisqualify();
      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(disqualifyParticipant).not.toHaveBeenCalled();
    });

    it('starts with an empty reason for the next participant', async () => {
      renderParticipants();
      const first = await openDisqualify(0);
      await first.user.type(
        within(first.dialog).getByLabelText(
          'Disqualification Reason (required)'
        ),
        'Draft'
      );
      await first.user.click(
        within(first.dialog).getByRole('button', { name: 'Cancel' })
      );

      const second = await openDisqualify(1);
      expect(
        within(second.dialog).getByLabelText(
          'Disqualification Reason (required)'
        )
      ).toHaveValue('');
    });
  });
});
