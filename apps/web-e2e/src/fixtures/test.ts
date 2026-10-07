import { mergeTests, test as base } from '@playwright/test';
import { applyTagModifiers } from '../helpers/tags';
import {
  PAGE_ERROR_ALLOWLIST,
  blockThirdParties,
  watchPageErrors,
  type PageErrorPattern
} from '../helpers/third-party';
import { test as personas } from './personas';

const suite = base.extend<
  { allowedPageErrors: PageErrorPattern[]; tagModifiers: void },
  object
>({
  allowedPageErrors: [[], { option: true }],
  tagModifiers: [
    async ({}, provide, testInfo) => {
      applyTagModifiers(testInfo);
      await provide();
    },
    { auto: true }
  ],
  context: async ({ context, allowedPageErrors }, provide) => {
    await blockThirdParties(context);
    const errors = watchPageErrors(context, [
      ...PAGE_ERROR_ALLOWLIST,
      ...allowedPageErrors
    ]);

    await provide(context);

    if (errors.length > 0) {
      throw new Error(
        `The page reported ${errors.length} error(s). Fix them, or add a pattern to allowedPageErrors when one is expected:\n\n${errors.join('\n\n')}`
      );
    }
  }
});

export const test = mergeTests(suite, personas);

export { expect } from '@playwright/test';
