import { describe, it, expect } from 'vitest';
import { updateTemplate } from '../update-template';
import { knownRequestError, prismaMock } from '@/test/prisma';
import { signIn, TEST_USER } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';

const settings = {
  name: 'Launch Party',
  description: 'Celebrate our launch',
  image: 'https://example.com/launch.png'
};

const input = {
  id: 'tpl-1',
  template: settings,
  setup: { name: 'Launch' },
  tasks: [{ id: 'task-1', type: 'BONUS_TASK' as const }],
  prizes: [],
  visibility: { visibility: 'PUBLIC' as const, slug: 'launch' }
};

const existing = {
  id: 'tpl-1',
  teamId: 'team-1',
  createdById: 'someone-else'
};

describe('updateTemplate', () => {
  describe('when the caller is not signed in', () => {
    it('returns UNAUTHORIZED without querying templates', async () => {
      const result = await updateTemplate(input);

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.template.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the input is invalid', () => {
    it('returns UNPROCESSABLE_CONTENT when the id is missing', async () => {
      signIn();

      const result = await updateTemplate({
        template: settings
      } as unknown as Parameters<typeof updateTemplate>[0]);

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(prismaMock.template.findUnique).not.toHaveBeenCalled();
    });

    it('returns UNPROCESSABLE_CONTENT when the input is null', async () => {
      signIn();

      const result = await updateTemplate(
        null as unknown as Parameters<typeof updateTemplate>[0]
      );

      expectFailure(result, 'UNPROCESSABLE_CONTENT');
    });
  });

  describe('when the caller belongs to the owning team', () => {
    it('looks the template up through any team the caller belongs to', async () => {
      signIn();
      prismaMock.template.findUnique.mockResolvedValue(existing);

      await updateTemplate(input);

      expect(prismaMock.template.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'tpl-1',
          team: { members: { some: { userId: TEST_USER.id } } }
        }
      });
    });

    it('writes the settings and content sections in storage format', async () => {
      signIn();
      prismaMock.template.findUnique.mockResolvedValue(existing);

      await updateTemplate(input);

      expect(prismaMock.template.update).toHaveBeenCalledWith({
        where: { id: 'tpl-1' },
        data: {
          teamId: 'team-1',
          createdById: TEST_USER.id,
          name: settings.name,
          description: settings.description,
          image: settings.image,
          content: {
            setup: input.setup,
            tasks: input.tasks,
            terms: undefined,
            design: undefined,
            prizes: [],
            audience: undefined,
            criteria: undefined,
            visibility: input.visibility
          }
        }
      });
    });

    it('reassigns the creator to the caller', async () => {
      signIn({ id: 'editor-7' });
      prismaMock.template.findUnique.mockResolvedValue(existing);

      await updateTemplate(input);

      expect(prismaMock.template.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ createdById: 'editor-7' })
        })
      );
    });

    it('returns the id of the stored template', async () => {
      signIn();
      prismaMock.template.findUnique.mockResolvedValue({
        ...existing,
        id: 'stored-id'
      });

      expect(expectOk(await updateTemplate(input))).toEqual({
        id: 'stored-id'
      });
    });

    it('does not persist content keys outside the template sections', async () => {
      signIn();
      prismaMock.template.findUnique.mockResolvedValue(existing);

      await updateTemplate({
        ...input,
        timing: { timeZone: 'UTC' }
      } as unknown as Parameters<typeof updateTemplate>[0]);

      const [{ data }] = prismaMock.template.update.mock.calls[0];
      expect(data.content).not.toHaveProperty('timing');
    });

    it('passes undefined settings when the input has no template settings', async () => {
      signIn();
      prismaMock.template.findUnique.mockResolvedValue(existing);

      const result = await updateTemplate({
        id: 'tpl-1'
      } as unknown as Parameters<typeof updateTemplate>[0]);

      expectOk(result);
      expect(prismaMock.template.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: undefined,
            description: undefined,
            image: undefined
          })
        })
      );
    });
  });

  describe('when the template is not accessible', () => {
    it('returns NOT_FOUND and does not update', async () => {
      signIn();
      prismaMock.template.findUnique.mockResolvedValue(null);

      const result = await updateTemplate(input);

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Template not found or you do not have access.'
      );
      expect(prismaMock.template.update).not.toHaveBeenCalled();
    });
  });

  describe('when the database fails', () => {
    it('maps a P2025 error from the update to NOT_FOUND', async () => {
      signIn();
      prismaMock.template.findUnique.mockResolvedValue(existing);
      prismaMock.template.update.mockRejectedValue(knownRequestError('P2025'));

      expectFailure(await updateTemplate(input), 'NOT_FOUND');
    });
  });
});
