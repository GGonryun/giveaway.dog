import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures/test';
import { expectNoStackTrace } from '../helpers/http';
import {
  captureServerAction,
  readActionResult,
  replayServerAction,
  sendServerActionBody,
  type ServerAction
} from '../helpers/rsc';

const captureSubscribe = async (page: Page): Promise<ServerAction> => {
  await page.goto('/browse');
  await page
    .getByRole('textbox', { name: 'Enter your email' })
    .fill('e2e-visitor@example.com');

  return captureServerAction(
    page,
    () => page.getByRole('button', { name: 'Subscribe' }).click(),
    { abort: true }
  );
};

test.describe('server action replays', { tag: '@security' }, () => {
  test.use({
    allowedPageErrors: [
      /net::ERR_FAILED|the server responded with a status of (404|500)/
    ]
  });

  test('a procedure refuses an input of the wrong type without a stack trace', async ({
    page
  }) => {
    const action = await captureSubscribe(page);

    for (const args of [[{ email: 5 }], [], [{ email: { toString: 1 } }]]) {
      const response = await replayServerAction(page, action, args);

      expectNoStackTrace(response.text);
      expect(readActionResult(response), JSON.stringify(args)).toMatchObject({
        ok: false,
        data: { code: 'UNPROCESSABLE_CONTENT' }
      });
    }
  });

  test('a body that is not JSON gets no stack trace', async ({
    page
  }, testInfo) => {
    const action = await captureSubscribe(page);

    const response = await sendServerActionBody(page, action, '[');

    expectNoStackTrace(response.text);
    testInfo.annotations.push({
      type: 'status',
      description: `A body that is not JSON: ${response.status}`
    });
  });

  test('an unknown action id gets no stack trace', async ({
    page
  }, testInfo) => {
    const action = await captureSubscribe(page);

    const response = await replayServerAction(page, {
      ...action,
      id: '0'.repeat(action.id.length)
    });

    expectNoStackTrace(response.text);
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
    testInfo.annotations.push({
      type: 'status',
      description: `An unknown action id: ${response.status}`
    });
  });
});
