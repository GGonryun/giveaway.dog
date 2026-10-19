import type { APIRequestContext, Browser, Page } from '@playwright/test';
import type { E2ePersona } from '@giveaway/e2e-model/personas';
import { BYPASS_STATE } from '../env';
import { signInAs } from './personas';
import { captureServerAction } from './rsc';
import { seedApi, type SeededSweepstakes } from './seed';
import { blockThirdParties } from './third-party';

export const ROLES_TEAM_MEMBERS = [
  { persona: 'admin', role: 'ADMIN' },
  { persona: 'member', role: 'MEMBER' },
  { persona: 'guest', role: 'GUEST' },
  { persona: 'blocked', role: 'BLOCKED' }
] as const;

export const seedRolesTeam = (request: APIRequestContext, ns: string) =>
  seedApi(request).team({
    ns,
    suffix: 'r',
    name: `Roles ${ns}`,
    members: [...ROLES_TEAM_MEMBERS]
  });

export const seedOtherTeam = (request: APIRequestContext, ns: string) =>
  seedApi(request).team({
    ns,
    suffix: 'o',
    name: `Other ${ns}`,
    owner: 'host2',
    members: [{ persona: 'blocked', role: 'MEMBER' }]
  });

export const openAs = async (
  browser: Browser,
  persona: E2ePersona | null,
  ns: string
) => {
  const context = await browser.newContext({ storageState: BYPASS_STATE });
  await blockThirdParties(context);
  const page = await context.newPage();
  const user = persona ? await signInAs(page.request, persona, ns) : null;
  return { context, page, user };
};

export const seedEndedWithWinner = (
  request: APIRequestContext,
  ns: string,
  team: string,
  persona: 'participant' | 'participant2'
) =>
  seedApi(request).sweepstakes({
    ns,
    team,
    preset: 'ended',
    entries: [{ persona, completions: [{ task: 0 }] }],
    draws: [{ entry: 0, prize: 0 }]
  });

export const captureCompleteAction = async (
  page: Page,
  slug: string,
  giveaway: SeededSweepstakes
) => {
  await page.goto(`/app/${slug}/sweepstakes/${giveaway.id}`);
  return captureServerAction(
    page,
    async () => {
      await page.getByRole('button', { name: 'Mark as Completed' }).click();
      await page
        .getByRole('alertdialog')
        .getByRole('button', { name: 'Yes, Complete Sweepstakes' })
        .click();
    },
    { abort: true }
  );
};

export const sweepstakesStatus = async (
  request: APIRequestContext,
  giveaway: SeededSweepstakes
) =>
  (
    await seedApi(request).rows<{ sweepstakes: { status: string } }>({
      view: 'sweepstakes',
      id: giveaway.id
    })
  ).sweepstakes.status;
