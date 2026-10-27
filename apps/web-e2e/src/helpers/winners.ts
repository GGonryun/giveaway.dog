import type { APIRequestContext, Locator, Page } from '@playwright/test';
import type { E2ePersona } from '@giveaway/e2e-model/personas';
import type { E2eSweepstakesRequestInput } from '@giveaway/e2e-model/requests';
import { expect } from '../fixtures/test';
import { seedApi } from './seed';

export const MIN_QUALITY_SCORE = 50;

export const ELIGIBLE_PERSONAS = [
  'participant',
  'participant2',
  'newbie'
] as const satisfies E2ePersona[];

export const LOW_QUALITY_PERSONA = 'member' satisfies E2ePersona;

export const REJECTED_PERSONA = 'guest' satisfies E2ePersona;

export const personaName = (persona: E2ePersona) => `E2E ${persona}`;

export type DrawRow = {
  id: string;
  prizeId: string;
  result: 'WINNER' | 'DISQUALIFIED';
  disqualificationReason: string | null;
  previousDrawId: string | null;
  completionId: string;
  participantId: string;
  userId: string;
  email: string | null;
};

export type CompletionRow = {
  id: string;
  taskId: string;
  status: 'COMPLETED' | 'PENDING' | 'REJECTED';
  reason: string | null;
  participantId: string;
  userId: string;
  email: string | null;
};

export const readDraws = (request: APIRequestContext, id: string) =>
  seedApi(request).rows<{
    byResult: Record<string, number>;
    draws: DrawRow[];
  }>({ view: 'draws', id });

export const readCompletions = (request: APIRequestContext, id: string) =>
  seedApi(request).rows<{
    byStatus: Record<string, number>;
    completions: CompletionRow[];
  }>({ view: 'completions', id });

export const eligibleEntries = (personas: readonly E2ePersona[]) =>
  personas.map((persona) => ({
    persona,
    completions: [{ task: 0 }],
    quality: 100
  }));

export const endedGiveaway = ({
  ns,
  team,
  prizes,
  ...rest
}: Pick<E2eSweepstakesRequestInput, 'ns' | 'team'> &
  Partial<E2eSweepstakesRequestInput>): E2eSweepstakesRequestInput => ({
  ns,
  team,
  preset: 'ended',
  prizes: prizes ?? [{ name: 'Golden Bone', quota: 1 }],
  criteria: {
    minQualityScore: MIN_QUALITY_SCORE,
    minTasksCompleted: 1,
    allowMultipleWins: false,
    allowUserSelection: false
  },
  ...rest
});

export const winnersPage = (team: string, id: string) =>
  `/app/${team}/sweepstakes/${id}/winners`;

export const presentationPage = (team: string, id: string) =>
  `/app/${team}/sweepstakes/${id}/winners/public`;

export const entriesPage = (team: string, id: string) =>
  `/app/${team}/sweepstakes/${id}/entries`;

export const participantsPage = (team: string, id: string) =>
  `/app/${team}/sweepstakes/${id}/participants`;

export const entryRow = (page: Page, persona: E2ePersona) =>
  page.getByRole('row').filter({
    has: page.getByRole('button', { name: personaName(persona), exact: true })
  });

export const participantRow = (page: Page, persona: E2ePersona) =>
  page.getByRole('row').filter({
    has: page.getByText(personaName(persona), { exact: true })
  });

export const drawRow = (scope: Page | Locator, name: string) =>
  scope
    .getByRole('row')
    .filter({ has: scope.getByText(name, { exact: true }) });

export const openWinnerMenu = async (page: Page, name: string) => {
  await drawRow(page, name)
    .getByRole('button', { name: 'Winner actions', exact: true })
    .click();
};

export const submitDisqualification = async (
  page: Page,
  action: 'Disqualify' | 'Disqualify & Re-roll',
  reason: string
) => {
  const dialog = page.getByRole('dialog');
  const confirm = dialog.getByRole('button', { name: action, exact: true });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel('Disqualification Reason *').fill(reason);
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(dialog).toBeHidden();
};
