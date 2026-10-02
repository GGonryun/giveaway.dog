import { describe, it, expect } from 'vitest';
import { TeamRole } from '@prisma/client';
import getInviteDetails from '../get-invite-details';
import { prismaMock } from '@/test/prisma';
import { signIn } from '@/test/session';
import { expectFailure, expectOk } from '@/test/result';
import {
  expectOutputFailure,
  inputIssuePaths
} from './fixtures-procedures-teams';

const team = {
  name: 'Acme',
  logo: 'https://example.com/logo.png',
  slug: 'acme'
};

const teamInclude = {
  team: { select: { name: true, logo: true, slug: true } }
};

describe('getInviteDetails', () => {
  describe('input validation', () => {
    it('rejects input without a code', async () => {
      const result = await getInviteDetails(
        {} as unknown as Parameters<typeof getInviteDetails>[0]
      );

      expect(inputIssuePaths(result)).toEqual([['code']]);
      expect(prismaMock.teamInviteLink.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('when the code is an invite link', () => {
    it('returns the team details without a role for signed-out visitors', async () => {
      prismaMock.teamInviteLink.findUnique.mockResolvedValue({
        id: 'link-1',
        team
      });

      const result = await getInviteDetails({ code: 'link-1' });

      expect(expectOk(result)).toEqual({
        teamName: 'Acme',
        teamLogo: 'https://example.com/logo.png',
        teamSlug: 'acme',
        role: null,
        isEmailInvite: false
      });
    });

    it('returns the same details for signed-in users', async () => {
      signIn();
      prismaMock.teamInviteLink.findUnique.mockResolvedValue({
        id: 'link-1',
        team
      });

      const result = await getInviteDetails({ code: 'link-1' });

      expect(expectOk(result).isEmailInvite).toBe(false);
    });

    it('looks the link up by id selecting only public team fields', async () => {
      prismaMock.teamInviteLink.findUnique.mockResolvedValue({
        id: 'link-1',
        team
      });

      await getInviteDetails({ code: 'link-1' });

      expect(prismaMock.teamInviteLink.findUnique).toHaveBeenCalledWith({
        where: { id: 'link-1' },
        include: teamInclude
      });
    });

    it('does not look for an email invite', async () => {
      prismaMock.teamInviteLink.findUnique.mockResolvedValue({
        id: 'link-1',
        team
      });

      await getInviteDetails({ code: 'link-1' });

      expect(prismaMock.teamInviteEmail.findFirst).not.toHaveBeenCalled();
    });

    it('ignores an expiration date in the past', async () => {
      prismaMock.teamInviteLink.findUnique.mockResolvedValue({
        id: 'link-1',
        expiresAt: new Date('2000-01-01T00:00:00.000Z'),
        team
      });

      const result = await getInviteDetails({ code: 'link-1' });

      expect(expectOk(result).teamSlug).toBe('acme');
    });
  });

  describe('when the code is an email invite', () => {
    it('returns the team details with the invited role', async () => {
      prismaMock.teamInviteLink.findUnique.mockResolvedValue(null);
      prismaMock.teamInviteEmail.findFirst.mockResolvedValue({
        id: 'email-1',
        email: 'invitee@example.com',
        role: TeamRole.GUEST,
        team
      });

      const result = await getInviteDetails({ code: 'email-1' });

      expect(expectOk(result)).toEqual({
        teamName: 'Acme',
        teamLogo: 'https://example.com/logo.png',
        teamSlug: 'acme',
        role: TeamRole.GUEST,
        isEmailInvite: true
      });
    });

    it('looks the email invite up by id selecting only public team fields', async () => {
      prismaMock.teamInviteLink.findUnique.mockResolvedValue(null);
      prismaMock.teamInviteEmail.findFirst.mockResolvedValue({
        id: 'email-1',
        role: TeamRole.MEMBER,
        team
      });

      await getInviteDetails({ code: 'email-1' });

      expect(prismaMock.teamInviteEmail.findFirst).toHaveBeenCalledWith({
        where: { id: 'email-1' },
        include: teamInclude
      });
    });

    it('does not reveal the invited email address', async () => {
      prismaMock.teamInviteLink.findUnique.mockResolvedValue(null);
      prismaMock.teamInviteEmail.findFirst.mockResolvedValue({
        id: 'email-1',
        email: 'invitee@example.com',
        role: TeamRole.MEMBER,
        team
      });

      const result = await getInviteDetails({ code: 'email-1' });

      expect(expectOk(result)).not.toHaveProperty('email');
    });
  });

  describe('when the code matches nothing', () => {
    it('returns NOT_FOUND', async () => {
      prismaMock.teamInviteLink.findUnique.mockResolvedValue(null);
      prismaMock.teamInviteEmail.findFirst.mockResolvedValue(null);

      const result = await getInviteDetails({ code: 'nope' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Invalid or expired invitation'
      );
    });
  });

  describe('output validation', () => {
    it('fails when the team logo is null', async () => {
      prismaMock.teamInviteLink.findUnique.mockResolvedValue({
        id: 'link-1',
        team: { ...team, logo: null }
      });

      const result = await getInviteDetails({ code: 'link-1' });

      expectOutputFailure(result);
    });

    it('fails when the email invite has an unknown role', async () => {
      prismaMock.teamInviteLink.findUnique.mockResolvedValue(null);
      prismaMock.teamInviteEmail.findFirst.mockResolvedValue({
        id: 'email-1',
        role: 'SUPERUSER',
        team
      });

      const result = await getInviteDetails({ code: 'email-1' });

      expectOutputFailure(result);
    });
  });
});
