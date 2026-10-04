import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamsProvider } from '@/components/context/team-provider';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  buildCompletion,
  buildParticipant,
  buildProvider,
  buildTask,
  buildTeam,
  buildTwitterField,
  buildUser
} from '@/components/sweepstakes/__tests__/fixtures';
import type { SweepstakesFormFieldSchema } from '@giveaway/custom-fields-model/schemas';
import type { SweepstakesParticipantSchema } from '@/lib/participant/schemas';
import { UNKNOWN_USER_NAME } from '@giveaway/app-config/settings';
import {
  ParticipatingUserSheet,
  UserDetailSheet,
  UserParticipantSheetContent
} from '../user-participant-detail-sheet';

const navigation = vi.hoisted(() => ({
  router: { push: vi.fn() },
  pathname: '/app/acme/sweepstakes/sweep-1/participants/user-1'
}));

vi.mock('next/navigation', () => ({
  useRouter: () => navigation.router,
  usePathname: () => navigation.pathname
}));

const team = buildTeam();

const Teams = ({ children }: { children: ReactNode }) => (
  <TeamsProvider value={{ activeTeam: team, teams: [team] }}>
    {children}
  </TeamsProvider>
);

const participant = buildParticipant({
  id: 'participant-1',
  user: buildUser({
    id: 'user-1',
    name: 'Jane Doe',
    qualityScore: 72,
    countryCode: 'US',
    providers: [buildProvider({ type: 'TWITTER', label: 'janedoe' })]
  }),
  allocation: { prize: { id: 'prize-1', name: 'Gaming Headset' } },
  formValues: { 'field-twitter': 'https://x.com/janedoe' },
  completions: [
    buildCompletion({
      id: 'c-1',
      task: buildTask({ id: 'task-1', title: 'Say hello' }),
      completedAt: new Date(2026, 8, 28, 15, 45)
    }),
    buildCompletion({
      id: 'c-2',
      task: buildTask({ id: 'task-2', title: 'Share the giveaway' }),
      completedAt: new Date(2026, 8, 30, 9, 5)
    })
  ]
});

const renderContent = (
  value: SweepstakesParticipantSchema | null = participant,
  {
    totalTasks = 4,
    fields = [buildTwitterField()]
  }: { totalTasks?: number | null; fields?: SweepstakesFormFieldSchema[] } = {}
) =>
  render(
    <Teams>
      <Sheet open>
        <SheetContent>
          <UserParticipantSheetContent
            participant={value}
            totalTasks={totalTasks}
            fields={fields}
          />
        </SheetContent>
      </Sheet>
    </Teams>
  );

const statistic = (label: string) =>
  screen.getByText(label).previousElementSibling?.textContent;

describe('UserParticipantSheetContent', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
  });

  it('renders nothing without a participant', () => {
    renderContent(null);
    expect(screen.getByRole('dialog')).not.toHaveTextContent('User Details');
  });

  it('titles the sheet with the participant name and email', () => {
    renderContent();
    const dialog = screen.getByRole('dialog', { name: 'Jane Doe' });
    expect(dialog).toHaveTextContent('j***e@example.com');
    expect(
      within(dialog).getByRole('link', { name: 'janedoe' })
    ).toHaveAttribute('href', 'https://x.com/janedoe');
  });

  it('falls back to the unknown user name', () => {
    renderContent(
      buildParticipant({ user: buildUser({ name: null }), completions: [] })
    );
    expect(
      screen.getByRole('dialog', { name: UNKNOWN_USER_NAME })
    ).toBeInTheDocument();
  });

  describe('statistics', () => {
    it('shows the number of entries, the engagement and the status', () => {
      renderContent();
      expect(statistic('Total Entries')).toBe('2');
      expect(statistic('Engagement')).toBe('50%');
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('reports zero engagement without a task count', () => {
      renderContent(participant, { totalTasks: null });
      expect(statistic('Engagement')).toBe('0%');
    });
  });

  describe('user details', () => {
    it('shows the quality, country, join date and last entry', () => {
      renderContent();
      expect(screen.getByText('Good')).toBeInTheDocument();
      expect(screen.getByText('US')).toBeInTheDocument();
      expect(
        screen.getByText('Joined on Jan 15, 2026, 09:30 AM')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Last entry was Sep 30, 2026, 09:05 AM')
      ).toBeInTheDocument();
    });

    it('links to the X profile from the entry form', () => {
      renderContent();
      expect(
        screen.getByRole('link', { name: 'https://x.com/janedoe' })
      ).toHaveAttribute('target', '_blank');
    });

    it('hides the X profile when the form has no twitter field', () => {
      renderContent(participant, { fields: [] });
      expect(
        screen.queryByRole('link', { name: 'https://x.com/janedoe' })
      ).not.toBeInTheDocument();
    });

    it('opens the profile of the user', async () => {
      const user = userEvent.setup();
      renderContent();
      await user.click(screen.getByRole('button', { name: 'See Profile' }));
      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/acme/users/user-1/overview'
      );
    });
  });

  describe('prize allocation', () => {
    it('shows the selected prize', () => {
      renderContent();
      expect(screen.getByText('Prize Allocation')).toBeInTheDocument();
      expect(screen.getByText('Gaming Headset')).toBeInTheDocument();
    });

    it('is hidden without an allocation', () => {
      renderContent({ ...participant, allocation: null });
      expect(screen.queryByText('Prize Allocation')).not.toBeInTheDocument();
    });
  });

  describe('recent entries', () => {
    it('links every entry to its task details in a new tab', () => {
      renderContent();
      const link = screen.getByRole('link', { name: /Share the giveaway/ });
      expect(link).toHaveAttribute(
        'href',
        '/app/acme/sweepstakes/sweep-1/entries/task/task-2?active=c-2'
      );
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveTextContent('Sep 30, 2026, 09:05 AM');
    });

    it('shows at most eight entries', () => {
      const completions = Array.from({ length: 10 }, (_, index) =>
        buildCompletion({
          id: `c-${index}`,
          task: buildTask({ id: `task-${index}`, title: `Task ${index}` })
        })
      );
      renderContent({ ...participant, completions });
      expect(screen.getAllByRole('link', { name: /Task \d/ })).toHaveLength(8);
    });

    it('explains when there are no entries', () => {
      renderContent({ ...participant, completions: [] });
      expect(screen.getByText('No entries yet')).toBeInTheDocument();
      expect(screen.queryByText(/Last entry was/)).not.toBeInTheDocument();
    });

    it('opens the entries of the user', async () => {
      const user = userEvent.setup();
      renderContent();
      await user.click(screen.getByRole('button', { name: 'See Entries' }));
      expect(navigation.router.push).toHaveBeenCalledWith(
        '/app/acme/users/user-1/overview'
      );
    });
  });

  it('links to the full user details', () => {
    renderContent();
    expect(
      screen.getByRole('link', { name: 'View Full Details' })
    ).toHaveAttribute('href', '/app/acme/users/user-1');
  });
});

describe('ParticipatingUserSheet', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
  });

  const renderSheet = (
    pathname: string,
    root: 'participants' | 'entries' | 'winners'
  ) => {
    navigation.pathname = pathname;
    return render(
      <ParticipatingUserSheet slug="acme" sweepstakesId="sweep-1" root={root}>
        <p>sheet body</p>
      </ParticipatingUserSheet>
    );
  };

  it.each([
    ['participants', '/app/acme/sweepstakes/sweep-1/participants/user-1'],
    ['entries', '/app/acme/sweepstakes/sweep-1/entries/user/user-1'],
    ['winners', '/app/acme/sweepstakes/sweep-1/winners/user/user-1']
  ] as const)('opens for a user under the %s root', (root, pathname) => {
    renderSheet(pathname, root);
    expect(screen.getByRole('dialog')).toHaveTextContent('sheet body');
  });

  it('stays closed without a user in the path', () => {
    renderSheet('/app/acme/sweepstakes/sweep-1/participants', 'participants');
    expect(screen.queryByText('sheet body')).not.toBeInTheDocument();
  });

  it('stays closed for an entries user path under the winners root', () => {
    renderSheet('/app/acme/sweepstakes/sweep-1/entries/user/user-1', 'winners');
    expect(screen.queryByText('sheet body')).not.toBeInTheDocument();
  });

  it('returns to the list of the root when closed', async () => {
    const user = userEvent.setup();
    renderSheet('/app/acme/sweepstakes/sweep-1/entries/user/user-1', 'entries');
    await user.keyboard('{Escape}');
    expect(navigation.router.push).toHaveBeenCalledWith(
      '/app/acme/sweepstakes/sweep-1/entries'
    );
    expect(screen.queryByText('sheet body')).not.toBeInTheDocument();
  });
});

describe('UserDetailSheet', () => {
  const renderSheet = (
    value: SweepstakesParticipantSchema | null,
    totalTasks: number | null
  ) => {
    const onOpenChangeAction = vi.fn();
    render(
      <Teams>
        <UserDetailSheet
          open
          participant={value}
          totalTasks={totalTasks}
          onOpenChangeAction={onOpenChangeAction}
        />
      </Teams>
    );
    return { onOpenChangeAction };
  };

  it('shows the participant details', () => {
    renderSheet(participant, 4);
    expect(
      screen.getByRole('dialog', { name: 'Jane Doe' })
    ).toBeInTheDocument();
  });

  it('does not parse the X profile from the form', () => {
    renderSheet(participant, 4);
    expect(
      screen.queryByRole('link', { name: 'https://x.com/janedoe' })
    ).not.toBeInTheDocument();
  });

  it('shows an empty sheet without a participant', () => {
    renderSheet(null, 4);
    expect(screen.getByRole('dialog')).not.toHaveTextContent('User Details');
  });

  it('shows an empty sheet when the sweepstakes has no tasks', () => {
    renderSheet(participant, 0);
    expect(screen.getByRole('dialog')).not.toHaveTextContent('Jane Doe');
  });

  it('reports when it is dismissed', async () => {
    const user = userEvent.setup();
    const { onOpenChangeAction } = renderSheet(participant, 4);
    await user.keyboard('{Escape}');
    expect(onOpenChangeAction).toHaveBeenCalledWith(false);
  });
});
