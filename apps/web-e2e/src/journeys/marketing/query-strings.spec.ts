import { expect, test } from '../../fixtures/test';
import { knownBug } from '../../helpers/known-bug';
import { expectNoErrorMarkers } from '../../helpers/public-pages';

// Each one showed "[ERROR-UNPROCESSABLE_CONTENT]: Input validation failed"
// with HTTP status 200 (#364). /history falls back to the defaults since #562.
const MALFORMED = [
  { path: '/winners?page=abc', issue: 364 },
  { path: '/winners?page=0', issue: 364 },
  { path: '/history?page=abc' },
  { path: '/history?sortBy=random' },
  { path: '/history?minEntrants=x' }
];

test.describe('malformed query strings', () => {
  for (const { path, issue } of MALFORMED) {
    test(
      `a visitor sees the default list at ${path}`,
      issue ? knownBug(issue) : {},
      async ({ request }) => {
        const response = await request.get(path);

        expect(response.status()).toBe(200);
        await expectNoErrorMarkers(response);
      }
    );
  }
});
