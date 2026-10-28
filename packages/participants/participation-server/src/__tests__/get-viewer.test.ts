import { describe, it, expect } from 'vitest';
import { USER_SCHEMA_SELECT_QUERY } from '@giveaway/user-model/user';
import { getViewer } from '../get-viewer';
import { prismaMock } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectOk } from '@giveaway/testing-server/result';
import { buildSelectedUser } from '@giveaway/testing-server/fixtures-procedures-browse-marketing-pickers';

describe('getViewer', () => {
  describe('when the caller is anonymous', () => {
    it('returns undefined without touching the database', async () => {
      const result = await getViewer();

      expect(expectOk(result)).toBeUndefined();
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the caller is signed in', () => {
    it('looks up the caller by id', async () => {
      signIn();
      prismaMock.user.findUnique.mockResolvedValue(
        buildSelectedUser({ id: TEST_USER.id })
      );

      await getViewer();

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: TEST_USER.id },
        select: USER_SCHEMA_SELECT_QUERY
      });
    });

    it('returns the caller', async () => {
      signIn();
      prismaMock.user.findUnique.mockResolvedValue(
        buildSelectedUser({ id: TEST_USER.id, name: 'Jane Doe' })
      );

      const viewer = expectOk(await getViewer());

      expect(viewer).toMatchObject({
        id: TEST_USER.id,
        name: 'Jane Doe',
        providers: [],
        isAnonymous: true
      });
    });

    it('returns undefined when the caller no longer exists', async () => {
      signIn();
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await getViewer();

      expect(expectOk(result)).toBeUndefined();
    });
  });
});
