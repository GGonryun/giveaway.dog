import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeamsProvider } from '@giveaway/team-context/team-provider';
import { Sheet, SheetContent } from '@giveaway/ui-primitives/sheet';
import {
  buildCompletion,
  buildParticipant,
  buildProvider,
  buildTask,
  buildTeam,
  buildTwitterField,
  buildUser,
  withStableIds
} from '@/components/sweepstakes/__tests__/fixtures';
import type { SweepstakesFormFieldSchema } from '@giveaway/custom-fields-model/schemas';
import type { SweepstakesParticipantSchema } from '@giveaway/participant-model/schemas';
import { UserParticipantSheetContent } from '../user-participant-detail-sheet';

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

describe('UserParticipantSheetContent', () => {
  beforeEach(() => {
    navigation.router.push.mockReset();
  });

  it('matches the snapshot', () => {
    renderContent();
    expect(withStableIds(screen.getByRole('dialog'))).toMatchSnapshot();
  });
});
