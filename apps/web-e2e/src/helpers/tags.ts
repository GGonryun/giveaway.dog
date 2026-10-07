import type { TestInfo } from '@playwright/test';

export const TAGS = {
  smoke: '@smoke',
  slow: '@slow',
  mobile: '@mobile',
  a11y: '@a11y',
  security: '@security',
  prodSafe: '@prod-safe',
  knownBug: '@known-bug',
  quarantine: '@quarantine'
} as const;

export const PROD_SMOKE_PROJECT = 'prod-smoke';

export const applyTagModifiers = (testInfo: TestInfo) => {
  if (
    testInfo.project.name === PROD_SMOKE_PROJECT &&
    !testInfo.tags.includes(TAGS.prodSafe)
  ) {
    throw new Error(
      `Every test of ${PROD_SMOKE_PROJECT} runs against production. Tag it ${TAGS.prodSafe} once it only reads and never signs in.`
    );
  }

  if (testInfo.tags.includes(TAGS.slow)) testInfo.slow();

  if (!testInfo.tags.includes(TAGS.knownBug)) return;

  const issue = testInfo.annotations.find(
    (annotation) => annotation.type === 'issue'
  )?.description;
  if (!issue) {
    throw new Error(
      `A ${TAGS.knownBug} test needs an issue. Declare it with knownBug(<issue>).`
    );
  }
  testInfo.fail(true, `Fails until ${issue} is fixed`);
};
