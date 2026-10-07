import { test as base } from '@playwright/test';
import type { E2ePersona } from '@giveaway/e2e-model/personas';
import { RUN_ID } from '../env';
import { signInAs, type SignedInPersona } from '../helpers/personas';

const MAX_PART = 36 * 36 - 1;

let freshCount = 0;

const toPart = (value: number, name: string) => {
  if (value > MAX_PART) throw new Error(`The ${name} is above ${MAX_PART}`);
  return value.toString(36).padStart(2, '0');
};

export const freshNamespace = (workerIndex: number) =>
  `${RUN_ID}${toPart(workerIndex, 'worker index')}${toPart(freshCount++, 'fresh persona count')}`;

export const test = base.extend<{
  freshPersona: (persona: E2ePersona) => Promise<SignedInPersona>;
}>({
  freshPersona: async ({ page }, provide, testInfo) => {
    await provide((persona) =>
      signInAs(page.request, persona, freshNamespace(testInfo.workerIndex))
    );
  }
});

export { expect } from '@playwright/test';
