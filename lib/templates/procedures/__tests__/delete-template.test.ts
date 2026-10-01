import { describe, it, expect } from 'vitest';
import { deleteTemplate } from '../delete-template';
import { knownRequestError, prismaMock } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import { nextCacheMock } from '@/test/next-cache';

const input = { templateId: 'tpl-1', slug: 'acme' };

describe('deleteTemplate', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without querying templates', async () => {
      const result = await deleteTemplate(input);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.template.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the input is invalid', () => {
    it('returns UNPROCESSABLE_CONTENT for a missing slug', async () => {
      signIn();

      const result = await deleteTemplate({
        templateId: 'tpl-1'
      } as unknown as Parameters<typeof deleteTemplate>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.template.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the caller can access the template', () => {
    it('looks up the template through a team the caller belongs to', async () => {
      signIn();
      prismaMock.template.findUnique.mockResolvedValue({ id: 'tpl-1' });

      await deleteTemplate(input);

      expect(prismaMock.template.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'tpl-1',
          team: {
            slug: 'acme',
            members: { some: { userId: TEST_USER.id } }
          }
        }
      });
    });

    it('deletes the template and reports success', async () => {
      signIn();
      prismaMock.template.findUnique.mockResolvedValue({ id: 'tpl-1' });

      const result = await deleteTemplate(input);

      expect(expectOk(result)).toEqual({ success: true });
      expect(prismaMock.template.delete).toHaveBeenCalledWith({
        where: { id: 'tpl-1' }
      });
    });

    it('does not revalidate any cache tags', async () => {
      signIn();
      prismaMock.template.findUnique.mockResolvedValue({ id: 'tpl-1' });

      await deleteTemplate(input);

      expect(nextCacheMock.revalidateTag).not.toHaveBeenCalled();
    });
  });

  describe('when the template is not accessible', () => {
    it('returns NOT_FOUND and deletes nothing', async () => {
      signIn();
      prismaMock.template.findUnique.mockResolvedValue(null);

      const result = await deleteTemplate(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Template not found or you do not have access.'
      );
      expect(prismaMock.template.delete).not.toHaveBeenCalled();
    });
  });

  describe('when the database fails', () => {
    it('maps a P2025 error from the delete to NOT_FOUND', async () => {
      signIn();
      prismaMock.template.findUnique.mockResolvedValue({ id: 'tpl-1' });
      prismaMock.template.delete.mockRejectedValue(knownRequestError('P2025'));

      const result = await deleteTemplate(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Unable to process your request. The item may no longer exist. Give us a minute before you try again.'
      );
    });

    it('maps other prisma errors to INTERNAL_SERVER_ERROR', async () => {
      signIn();
      prismaMock.template.findUnique.mockRejectedValue(
        knownRequestError('P2002')
      );

      const result = await deleteTemplate(input);

      expectFailure(result, 'INTERNAL_SERVER_ERROR');
      expect(prismaMock.template.delete).not.toHaveBeenCalled();
    });
  });
});
