import { expect, test } from '../../fixtures/test';
import { knownBug } from '../../helpers/known-bug';
import { expectNoErrorMarkers } from '../../helpers/public-pages';

// Each one shows "[ERROR-UNPROCESSABLE_CONTENT]: Input validation failed"
// with HTTP status 200 (#364).
const MALFORMED = [
  '/winners?page=abc',
  '/winners?page=0',
  '/history?page=abc',
  '/history?sortBy=random',
  '/history?minEntrants=x'
];

test.describe('malformed query strings', () => {
  for (const path of MALFORMED) {
    test(
      `a visitor sees the default list at ${path}`,
      knownBug(364),
      async ({ request }) => {
        const response = await request.get(path);

        expect(response.status()).toBe(200);
        await expectNoErrorMarkers(response);
      }
    );
  }
});
