import { describe, it, expect, beforeEach } from 'vitest';
import { TeamRole, UserAccountType } from '@prisma/client';
import acceptInvite from '../accept-invite';
import {
  prismaMock,
  knownRequestError,
  createPrismaMock,
  type PrismaMock
} from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  inputIssues,
  PRISMA_INTERNAL_ERROR_MESSAGE,
  PRISMA_NOT_FOUND_MESSAGE
} from './fixtures-procedures-teams';

const team = {
  id: 'team-1',
  name: 'Acme',
  slug: 'acme',
  logo: 'https://example.com/logo.png'
};

const otherTeam = {
  id: 'team-2',
  name: 'Other',
  slug: 'other',
  logo: 'https://example.com/other.png'
};

const inviteLink = (overrides: Record<string, unknown> = {}) => ({
  id: 'link-1',
  teamId: team.id,
  expiresAt: null,
  team,
  ...overrides
});

const emailInvite = (overrides: Record<string, unknown> = {}) => ({
  id: 'email-1',
  teamId: team.id,
  email: TEST_USER.email,
  role: TeamRole.ADMIN,
  team,
  ...overrides
});

describe('acceptInvite', () => {
  describe('authorization and input', () => {
    it('rejects unauthenticated callers without touching the database', async () => {
      const result = await acceptInvite({ code: 'link-1' });

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.teamInviteLink.findUnique).not.toHaveBeenCalled();
    });

    it('rejects input without a code', async () => {
      signIn();

      const result = await acceptInvite(
        {} as unknown as Parameters<typeof acceptInvite>[0]
      );

      expect(inputIssues(result)).toEqual([
        expect.objectContaining({ path: ['code'], message: 'Required' })
      ]);
      expect(prismaMock.teamInviteLink.findUnique).not.toHaveBeenCalled();
    });

    it('rejects a non-string code', async () => {
      signIn();

      const result = await acceptInvite({
        code: 42
      } as unknown as Parameters<typeof acceptInvite>[0]);

      expect(inputIssues(result)).toEqual([
        expect.objectContaining({
          path: ['code'],
          message: 'Expected string, received number'
        })
      ]);
    });
  });

  describe('invite lookup', () => {
    beforeEach(() => {
      signIn();
    });

    it('looks the code up as both an invite link and an email invite', async () => {
      prismaMock.teamInviteLink.findUnique.mockResolvedValue(null);
      prismaMock.teamInviteEmail.findFirst.mockResolvedValue(null);

      await acceptInvite({ code: 'abc' });

      expect(prismaMock.teamInviteLink.findUnique).toHaveBeenCalledWith({
        where: { id: 'abc' },
        include: { team: true }
      });
      expect(prismaMock.teamInviteEmail.findFirst).toHaveBeenCalledWith({
        where: { id: 'abc' },
        include: { team: true }
      });
    });

    it('still queries email invites when an invite link matched', async () => {
      prismaMock.teamInviteLink.findUnique.mockResolvedValue(inviteLink());
      prismaMock.teamInviteEmail.findFirst.mockResolvedValue(null);
      prismaMock.membership.findFirst.mockResolvedValue(null);

      await acceptInvite({ code: 'link-1' });

      expect(prismaMock.teamInviteEmail.findFirst).toHaveBeenCalledTimes(1);
    });

    it('returns NOT_FOUND when the code matches no invitation', async () => {
      prismaMock.teamInviteLink.findUnique.mockResolvedValue(null);
      prismaMock.teamInviteEmail.findFirst.mockResolvedValue(null);

      const result = await acceptInvite({ code: 'nope' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        'Invalid or expired invitation'
      );
      expect(prismaMock.membership.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('when accepting an invite link', () => {
    beforeEach(() => {
      signIn();
      prismaMock.teamInviteLink.findUnique.mockResolvedValue(inviteLink());
      prismaMock.teamInviteEmail.findFirst.mockResolvedValue(null);
      prismaMock.membership.findFirst.mockResolvedValue(null);
    });

    it('returns the team slug and name', async () => {
      const result = await acceptInvite({ code: 'link-1' });

      expect(expectOk(result)).toEqual({ teamSlug: 'acme', teamName: 'Acme' });
    });

    it('checks for an existing membership of the caller in the invited team', async () => {
      await acceptInvite({ code: 'link-1' });

      expect(prismaMock.membership.findFirst).toHaveBeenCalledWith({
        where: { userId: TEST_USER.id, teamId: 'team-1' }
      });
    });

    it('creates a MEMBER membership inside a transaction', async () => {
      await acceptInvite({ code: 'link-1' });

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaMock.membership.create).toHaveBeenCalledWith({
        data: { userId: TEST_USER.id, teamId: 'team-1', role: TeamRole.MEMBER }
      });
    });

    it('promotes the caller account to HOST', async () => {
      await acceptInvite({ code: 'link-1' });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: TEST_USER.id },
        data: { accountType: UserAccountType.HOST }
      });
    });

    it('does not delete the invite link so it can be reused', async () => {
      await acceptInvite({ code: 'link-1' });

      expect(prismaMock.teamInviteLink.delete).not.toHaveBeenCalled();
      expect(prismaMock.teamInviteEmail.delete).not.toHaveBeenCalled();
    });

    it('accepts the link regardless of the caller email', async () => {
      signIn({ email: 'someone-else@example.com' });

      const result = await acceptInvite({ code: 'link-1' });

      expectOk(result);
    });

    it('accepts an invite link whose expiresAt is in the past', async () => {
      prismaMock.teamInviteLink.findUnique.mockResolvedValue(
        inviteLink({ expiresAt: new Date('2000-01-01T00:00:00.000Z') })
      );

      const result = await acceptInvite({ code: 'link-1' });

      expect(expectOk(result)).toEqual({ teamSlug: 'acme', teamName: 'Acme' });
      expect(prismaMock.membership.create).toHaveBeenCalled();
    });

    it('returns CONFLICT when the caller is already a member', async () => {
      prismaMock.membership.findFirst.mockResolvedValue({
        id: 'm-1',
        userId: TEST_USER.id,
        teamId: 'team-1',
        role: TeamRole.MEMBER
      });

      const result = await acceptInvite({ code: 'link-1' });

      expect(expectFailure(result, 'CONFLICT').message).toBe(
        'You are already a member of this team'
      );
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
      expect(prismaMock.membership.create).not.toHaveBeenCalled();
    });

    it('returns CONFLICT when the caller is blocked from the team', async () => {
      prismaMock.membership.findFirst.mockResolvedValue({
        id: 'm-1',
        userId: TEST_USER.id,
        teamId: 'team-1',
        role: TeamRole.BLOCKED
      });

      const result = await acceptInvite({ code: 'link-1' });

      expect(expectFailure(result, 'CONFLICT').message).toBe(
        'You are already a member of this team'
      );
    });
  });

  describe('when accepting an email invite', () => {
    beforeEach(() => {
      signIn();
      prismaMock.teamInviteLink.findUnique.mockResolvedValue(null);
      prismaMock.teamInviteEmail.findFirst.mockResolvedValue(emailInvite());
      prismaMock.membership.findFirst.mockResolvedValue(null);
    });

    it('returns the team slug and name', async () => {
      const result = await acceptInvite({ code: 'email-1' });

      expect(expectOk(result)).toEqual({ teamSlug: 'acme', teamName: 'Acme' });
    });

    it('creates the membership with the role from the invitation', async () => {
      await acceptInvite({ code: 'email-1' });

      expect(prismaMock.membership.create).toHaveBeenCalledWith({
        data: { userId: TEST_USER.id, teamId: 'team-1', role: TeamRole.ADMIN }
      });
    });

    it('promotes the caller account to HOST', async () => {
      await acceptInvite({ code: 'email-1' });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: TEST_USER.id },
        data: { accountType: UserAccountType.HOST }
      });
    });

    it('deletes the consumed email invitation', async () => {
      await acceptInvite({ code: 'email-1' });

      expect(prismaMock.teamInviteEmail.delete).toHaveBeenCalledWith({
        where: { id: 'email-1' }
      });
    });

    it('returns FORBIDDEN when the invitation was sent to another email', async () => {
      prismaMock.teamInviteEmail.findFirst.mockResolvedValue(
        emailInvite({ email: 'invitee@example.com' })
      );

      const result = await acceptInvite({ code: 'email-1' });

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        'This invitation was sent to a different email address. Please log in with the correct account.'
      );
      expect(prismaMock.membership.findFirst).not.toHaveBeenCalled();
      expect(prismaMock.membership.create).not.toHaveBeenCalled();
      expect(prismaMock.teamInviteEmail.delete).not.toHaveBeenCalled();
    });

    it('compares emails case-sensitively', async () => {
      prismaMock.teamInviteEmail.findFirst.mockResolvedValue(
        emailInvite({ email: TEST_USER.email.toUpperCase() })
      );

      const result = await acceptInvite({ code: 'email-1' });

      expectFailure(result, 'FORBIDDEN');
    });

    it('returns FORBIDDEN when the session has no email', async () => {
      signIn({ email: null });

      const result = await acceptInvite({ code: 'email-1' });

      expectFailure(result, 'FORBIDDEN');
    });

    it('returns CONFLICT when the caller is already a member', async () => {
      prismaMock.membership.findFirst.mockResolvedValue({ id: 'm-1' });

      const result = await acceptInvite({ code: 'email-1' });

      expect(expectFailure(result, 'CONFLICT').message).toBe(
        'You are already a member of this team'
      );
      expect(prismaMock.teamInviteEmail.delete).not.toHaveBeenCalled();
    });
  });

  describe('when the code matches both an invite link and an email invite', () => {
    beforeEach(() => {
      signIn();
      prismaMock.teamInviteLink.findUnique.mockResolvedValue(
        inviteLink({ id: 'shared', team })
      );
      prismaMock.teamInviteEmail.findFirst.mockResolvedValue(
        emailInvite({ id: 'shared', team: otherTeam, role: TeamRole.GUEST })
      );
      prismaMock.membership.findFirst.mockResolvedValue(null);
    });

    it('joins the invite link team using the email invite role', async () => {
      const result = await acceptInvite({ code: 'shared' });

      expect(expectOk(result)).toEqual({ teamSlug: 'acme', teamName: 'Acme' });
      expect(prismaMock.membership.create).toHaveBeenCalledWith({
        data: { userId: TEST_USER.id, teamId: 'team-1', role: TeamRole.GUEST }
      });
      expect(prismaMock.teamInviteEmail.delete).toHaveBeenCalledWith({
        where: { id: 'shared' }
      });
    });

    it('enforces the email invite recipient', async () => {
      prismaMock.teamInviteEmail.findFirst.mockResolvedValue(
        emailInvite({ id: 'shared', email: 'invitee@example.com' })
      );

      const result = await acceptInvite({ code: 'shared' });

      expectFailure(result, 'FORBIDDEN');
    });
  });

  describe('transaction boundary', () => {
    let tx: PrismaMock;

    beforeEach(() => {
      signIn();
      tx = createPrismaMock();
      prismaMock.$transaction.mockImplementation(
        async (callback: (client: PrismaMock) => Promise<unknown>) =>
          callback(tx)
      );
      prismaMock.teamInviteLink.findUnique.mockResolvedValue(null);
      prismaMock.teamInviteEmail.findFirst.mockResolvedValue(emailInvite());
      prismaMock.membership.findFirst.mockResolvedValue(null);
    });

    it('creates the membership through the transaction client', async () => {
      await acceptInvite({ code: 'email-1' });

      expect(tx.membership.create).toHaveBeenCalledWith({
        data: { userId: TEST_USER.id, teamId: 'team-1', role: TeamRole.ADMIN }
      });
      expect(prismaMock.membership.create).not.toHaveBeenCalled();
    });

    it('promotes the account through the transaction client', async () => {
      await acceptInvite({ code: 'email-1' });

      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: TEST_USER.id },
        data: { accountType: UserAccountType.HOST }
      });
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('deletes the email invitation through the transaction client', async () => {
      await acceptInvite({ code: 'email-1' });

      expect(tx.teamInviteEmail.delete).toHaveBeenCalledWith({
        where: { id: 'email-1' }
      });
      expect(prismaMock.teamInviteEmail.delete).not.toHaveBeenCalled();
    });

    it('performs the writes in order: membership, account, invitation', async () => {
      await acceptInvite({ code: 'email-1' });

      const [create] = tx.membership.create.mock.invocationCallOrder;
      const [update] = tx.user.update.mock.invocationCallOrder;
      const [remove] = tx.teamInviteEmail.delete.mock.invocationCallOrder;
      expect(create).toBeLessThan(update);
      expect(update).toBeLessThan(remove);
    });

    it('returns the transaction failure when a write inside it fails', async () => {
      tx.user.update.mockRejectedValue(new Error('tx aborted'));

      const result = await acceptInvite({ code: 'email-1' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'tx aborted'
      );
      expect(tx.teamInviteEmail.delete).not.toHaveBeenCalled();
    });
  });

  describe('when the database fails', () => {
    beforeEach(() => {
      signIn();
      prismaMock.teamInviteLink.findUnique.mockResolvedValue(inviteLink());
      prismaMock.teamInviteEmail.findFirst.mockResolvedValue(null);
      prismaMock.membership.findFirst.mockResolvedValue(null);
    });

    it('maps a unique constraint violation during membership creation to INTERNAL_SERVER_ERROR', async () => {
      prismaMock.membership.create.mockRejectedValue(
        knownRequestError('P2002')
      );

      const result = await acceptInvite({ code: 'link-1' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toMatch(
        PRISMA_INTERNAL_ERROR_MESSAGE
      );
    });

    it('stops the transaction before updating the user when membership creation fails', async () => {
      prismaMock.membership.create.mockRejectedValue(
        knownRequestError('P2002')
      );

      await acceptInvite({ code: 'link-1' });

      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('maps a missing record during the user update to NOT_FOUND', async () => {
      prismaMock.user.update.mockRejectedValue(knownRequestError('P2025'));

      const result = await acceptInvite({ code: 'link-1' });

      expect(expectFailure(result, 'NOT_FOUND').message).toBe(
        PRISMA_NOT_FOUND_MESSAGE
      );
    });

    it('returns INTERNAL_SERVER_ERROR with the message of an unexpected error', async () => {
      prismaMock.teamInviteLink.findUnique.mockRejectedValue(
        new Error('connection lost')
      );

      const result = await acceptInvite({ code: 'link-1' });

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'connection lost'
      );
    });
  });
});
