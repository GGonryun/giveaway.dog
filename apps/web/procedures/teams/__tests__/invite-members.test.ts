import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TeamRole } from '@prisma/client';
import inviteMembers from '../invite-members';
import { prismaMock, knownRequestError } from '@giveaway/testing-server/prisma';
import { signIn, TEST_USER } from '@giveaway/testing-server/session';
import { expectFailure, expectOk } from '@giveaway/testing-server/result';
import {
  callerMembershipWhere,
  callerTeam,
  inputIssuePaths,
  inputIssues,
  PRISMA_INTERNAL_ERROR_MESSAGE,
  NOT_A_MEMBER_MESSAGE,
  permissionDeniedMessage,
  rolesExcept
} from './fixtures-procedures-teams';

const inbound = vi.hoisted(() => ({
  construct: vi.fn(),
  send: vi.fn()
}));

vi.mock('inboundemail', () => ({
  default: class {
    emails = { send: inbound.send };
    constructor(options: unknown) {
      inbound.construct(options);
    }
  }
}));

type InviteInput = Parameters<typeof inviteMembers>[0];

const teamDetails = {
  name: 'Acme',
  logo: 'https://example.com/logo.png'
};

const invitation = (
  email: string,
  role: TeamRole = TeamRole.MEMBER
): InviteInput['invitations'][number] => ({ email, role });

const request = (...invitations: InviteInput['invitations']): InviteInput => ({
  slug: 'acme',
  invitations
});

const setupNewInvitees = () => {
  prismaMock.user.findUnique.mockResolvedValue(null);
  prismaMock.teamInviteEmail.findUnique.mockResolvedValue(null);
  prismaMock.teamInviteEmail.create.mockImplementation(
    async ({ data }: { data: { email: string } }) => ({
      id: `invite-${data.email}`,
      ...data
    })
  );
};

describe('inviteMembers', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    inbound.construct.mockReset();
    inbound.send.mockReset();
    inbound.send.mockResolvedValue({ id: 'sent-1' });
    vi.stubEnv('INBOUND_SECRET', 'inbound-secret');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://giveaway.test');
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('authorization', () => {
    it('rejects unauthenticated callers', async () => {
      const result = await inviteMembers(request(invitation('a@example.com')));

      expect(expectFailure(result, 'UNAUTHORIZED').message).toBe(
        'Invalid session'
      );
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('input validation', () => {
    beforeEach(() => {
      signIn();
    });

    it('rejects an invalid email address', async () => {
      const result = await inviteMembers(request(invitation('not-an-email')));

      const failure = expectFailure(result, 'UNPROCESSABLE_CONTENT');
      expect(failure.message).toContain('Invalid email address');
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });

    it('rejects an unknown role', async () => {
      const result = await inviteMembers(
        request({
          email: 'a@example.com',
          role: 'SUPERUSER'
        } as unknown as InviteInput['invitations'][number])
      );

      expect(inputIssuePaths(result)).toEqual([['invitations', 0, 'role']]);
    });

    it('rejects a missing invitations list', async () => {
      const result = await inviteMembers({
        slug: 'acme'
      } as unknown as InviteInput);

      expect(inputIssuePaths(result)).toEqual([['invitations']]);
    });

    it('rejects input without a slug', async () => {
      const result = await inviteMembers({
        invitations: [invitation('a@example.com')]
      } as unknown as InviteInput);

      expect(inputIssuePaths(result)).toEqual([['slug']]);
      expect(prismaMock.team.findFirst).not.toHaveBeenCalled();
    });

    it('rejects the whole batch when any email is invalid', async () => {
      const result = await inviteMembers(
        request(invitation('a@example.com'), invitation('bad'))
      );

      expect(inputIssues(result)).toEqual([
        expect.objectContaining({
          path: ['invitations', 1, 'email'],
          message: 'Invalid email address'
        })
      ]);
      expect(prismaMock.teamInviteEmail.create).not.toHaveBeenCalled();
    });
  });

  describe('team lookup and permissions', () => {
    beforeEach(() => {
      signIn();
    });

    it('queries the team with its name, logo and the caller membership', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(TeamRole.OWNER, teamDetails)
      );

      await inviteMembers(request());

      expect(prismaMock.team.findFirst).toHaveBeenCalledWith({
        where: callerMembershipWhere('acme'),
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          members: {
            where: { userId: TEST_USER.id },
            select: { role: true, userId: true }
          }
        }
      });
    });

    it('returns NOT_FOUND when the caller is not on the team', async () => {
      prismaMock.team.findFirst.mockResolvedValue(null);

      const result = await inviteMembers(request(invitation('a@example.com')));

      expect(expectFailure(result, 'NOT_FOUND').message).toBe('Team not found');
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
    });

    it.each(rolesExcept(TeamRole.OWNER, TeamRole.ADMIN))(
      'returns FORBIDDEN for a %s',
      async (role) => {
        prismaMock.team.findFirst.mockResolvedValue(
          callerTeam(role, teamDetails)
        );

        const result = await inviteMembers(
          request(invitation('a@example.com'))
        );

        expect(expectFailure(result, 'FORBIDDEN').message).toBe(
          permissionDeniedMessage('INVITE_MEMBERS')
        );
        expect(prismaMock.teamInviteEmail.create).not.toHaveBeenCalled();
      }
    );

    it('returns FORBIDDEN when no membership row is returned', async () => {
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(null, teamDetails)
      );

      const result = await inviteMembers(request(invitation('a@example.com')));

      expect(expectFailure(result, 'FORBIDDEN').message).toBe(
        NOT_A_MEMBER_MESSAGE
      );
    });

    it.each([TeamRole.OWNER, TeamRole.ADMIN])(
      'allows a %s to invite',
      async (role) => {
        prismaMock.team.findFirst.mockResolvedValue(
          callerTeam(role, teamDetails)
        );
        setupNewInvitees();

        const result = await inviteMembers(
          request(invitation('a@example.com'))
        );

        expect(expectOk(result).invited).toEqual(['a@example.com']);
      }
    );
  });

  describe('with no invitations', () => {
    it('succeeds without querying or sending anything', async () => {
      signIn();
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(TeamRole.OWNER, teamDetails)
      );

      const result = await inviteMembers(request());

      expect(expectOk(result)).toEqual({
        success: true,
        invited: [],
        skipped: []
      });
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
      expect(inbound.send).not.toHaveBeenCalled();
    });
  });

  describe('when inviting a new email', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(TeamRole.ADMIN, teamDetails)
      );
      setupNewInvitees();
    });

    it('reports the email as invited', async () => {
      const result = await inviteMembers(
        request(invitation('new@example.com', TeamRole.GUEST))
      );

      expect(expectOk(result)).toEqual({
        success: true,
        invited: ['new@example.com'],
        skipped: []
      });
    });

    it('checks whether a user with the email is already on the team', async () => {
      await inviteMembers(request(invitation('new@example.com')));

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'new@example.com' },
        select: {
          id: true,
          teams: { where: { teamId: 'team-1' }, select: { id: true } }
        }
      });
    });

    it('checks for a pending invitation by team and email', async () => {
      await inviteMembers(request(invitation('new@example.com')));

      expect(prismaMock.teamInviteEmail.findUnique).toHaveBeenCalledWith({
        where: {
          teamId_email: { teamId: 'team-1', email: 'new@example.com' }
        }
      });
    });

    it('stores the invitation with the requested role', async () => {
      await inviteMembers(
        request(invitation('new@example.com', TeamRole.GUEST))
      );

      expect(prismaMock.teamInviteEmail.create).toHaveBeenCalledWith({
        data: {
          teamId: 'team-1',
          email: 'new@example.com',
          role: TeamRole.GUEST
        }
      });
    });

    it('creates the email client with the INBOUND_SECRET', async () => {
      await inviteMembers(request(invitation('new@example.com')));

      expect(inbound.construct).toHaveBeenCalledWith({
        apiKey: 'inbound-secret'
      });
    });

    it('sends the invitation from the no-reply address to the invitee', async () => {
      await inviteMembers(
        request(invitation('new@example.com', TeamRole.GUEST))
      );

      expect(inbound.send).toHaveBeenCalledTimes(1);
      expect(inbound.send).toHaveBeenCalledWith({
        from: 'noreply@giveaway.dog',
        to: 'new@example.com',
        subject: "You've been invited to join Acme - Giveaway.Dog",
        html: expect.stringContaining(
          'href="https://giveaway.test/invites/invite-new@example.com"'
        ),
        text: expect.stringContaining(
          'Test User has invited you to join "Acme"'
        )
      });
    });

    it('includes the role, invite url and team logo in the email', async () => {
      await inviteMembers(
        request(invitation('new@example.com', TeamRole.GUEST))
      );

      const [payload] = inbound.send.mock.calls[0];
      expect(payload.text).toContain('YOUR ROLE\n=========\nGUEST');
      expect(payload.text).toContain(
        'https://giveaway.test/invites/invite-new@example.com'
      );
      expect(payload.html).toContain('src="https://example.com/logo.png"');
    });

    it('omits the inviter name when the caller has no name', async () => {
      signIn({ name: '' });

      await inviteMembers(request(invitation('new@example.com')));

      const [payload] = inbound.send.mock.calls[0];
      expect(payload.text).toContain('You\'ve been invited to join "Acme"');
      expect(payload.text).not.toContain('has invited you');
    });

    it('builds the invite url with the localhost fallback', async () => {
      vi.stubEnv('NEXT_PUBLIC_APP_URL', '');

      await inviteMembers(request(invitation('new@example.com')));

      const [payload] = inbound.send.mock.calls[0];
      expect(payload.text).toContain(
        'http://localhost:3000/invites/invite-new@example.com'
      );
    });

    it('invites a registered user who is not on the team', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'user-2', teams: [] });

      const result = await inviteMembers(
        request(invitation('known@example.com'))
      );

      expect(expectOk(result).invited).toEqual(['known@example.com']);
    });
  });

  describe('when the email has mixed casing', () => {
    const MIXED = 'Mixed@Example.com';

    beforeEach(() => {
      signIn();
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(TeamRole.ADMIN, teamDetails)
      );
      setupNewInvitees();
    });

    it('looks the user up with the email exactly as typed', async () => {
      await inviteMembers(request(invitation(MIXED)));

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: MIXED } })
      );
    });

    it('looks the pending invitation up with the email exactly as typed', async () => {
      await inviteMembers(request(invitation(MIXED)));

      expect(prismaMock.teamInviteEmail.findUnique).toHaveBeenCalledWith({
        where: { teamId_email: { teamId: 'team-1', email: MIXED } }
      });
    });

    it('stores the invitation without normalizing the email', async () => {
      await inviteMembers(request(invitation(MIXED)));

      expect(prismaMock.teamInviteEmail.create).toHaveBeenCalledWith({
        data: { teamId: 'team-1', email: MIXED, role: TeamRole.MEMBER }
      });
    });

    it('sends the email to the address exactly as typed', async () => {
      await inviteMembers(request(invitation(MIXED)));

      expect(inbound.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: MIXED })
      );
    });

    it('reports the address exactly as typed', async () => {
      const result = await inviteMembers(request(invitation(MIXED)));

      expect(expectOk(result).invited).toEqual([MIXED]);
    });

    it('treats differently cased addresses as separate invitations', async () => {
      const result = await inviteMembers(
        request(invitation(MIXED), invitation('mixed@example.com'))
      );

      expect(expectOk(result).invited).toEqual([MIXED, 'mixed@example.com']);
      expect(prismaMock.teamInviteEmail.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('when an invitation is skipped', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(TeamRole.OWNER, teamDetails)
      );
      setupNewInvitees();
    });

    it('skips users who are already members', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-2',
        teams: [{ id: 'm-2' }]
      });

      const result = await inviteMembers(
        request(invitation('member@example.com'))
      );

      expect(expectOk(result)).toEqual({
        success: true,
        invited: [],
        skipped: [
          {
            email: 'member@example.com',
            reason: 'User is already a member of this team'
          }
        ]
      });
      expect(prismaMock.teamInviteEmail.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.teamInviteEmail.create).not.toHaveBeenCalled();
    });

    it('skips emails with a pending invitation', async () => {
      prismaMock.teamInviteEmail.findUnique.mockResolvedValue({
        id: 'existing-invite'
      });

      const result = await inviteMembers(
        request(invitation('pending@example.com'))
      );

      expect(expectOk(result).skipped).toEqual([
        {
          email: 'pending@example.com',
          reason: 'Invitation already sent to this email'
        }
      ]);
      expect(prismaMock.teamInviteEmail.create).not.toHaveBeenCalled();
      expect(inbound.send).not.toHaveBeenCalled();
    });
  });

  describe('when sending the email fails', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(TeamRole.OWNER, teamDetails)
      );
      setupNewInvitees();
    });

    it('skips the email with a send failure reason', async () => {
      inbound.send.mockRejectedValue(new Error('smtp down'));

      const result = await inviteMembers(
        request(invitation('new@example.com'))
      );

      expect(expectOk(result)).toEqual({
        success: true,
        invited: [],
        skipped: [
          {
            email: 'new@example.com',
            reason: 'Failed to send invitation email'
          }
        ]
      });
    });

    it('deletes the stored invitation', async () => {
      inbound.send.mockRejectedValue(new Error('smtp down'));

      await inviteMembers(request(invitation('new@example.com')));

      expect(prismaMock.teamInviteEmail.delete).toHaveBeenCalledWith({
        where: { id: 'invite-new@example.com' }
      });
    });

    it('logs the send failure', async () => {
      const failure = new Error('smtp down');
      inbound.send.mockRejectedValue(failure);

      await inviteMembers(request(invitation('new@example.com')));

      expect(consoleError).toHaveBeenCalledWith(
        'Failed to send invitation email:',
        failure
      );
    });

    it('treats a missing INBOUND_SECRET as a send failure', async () => {
      vi.stubEnv('INBOUND_SECRET', '');

      const result = await inviteMembers(
        request(invitation('new@example.com'))
      );

      expect(expectOk(result).skipped).toEqual([
        {
          email: 'new@example.com',
          reason: 'Failed to send invitation email'
        }
      ]);
      expect(inbound.construct).not.toHaveBeenCalled();
      expect(prismaMock.teamInviteEmail.delete).toHaveBeenCalledWith({
        where: { id: 'invite-new@example.com' }
      });
    });

    it('fails the whole request when cleaning up the invitation also fails', async () => {
      inbound.send.mockRejectedValue(new Error('smtp down'));
      prismaMock.teamInviteEmail.delete.mockRejectedValue(
        new Error('delete failed')
      );

      const result = await inviteMembers(
        request(invitation('new@example.com'))
      );

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toBe(
        'delete failed'
      );
    });
  });

  describe('with a mixed batch', () => {
    beforeEach(() => {
      signIn();
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(TeamRole.OWNER, teamDetails)
      );
      setupNewInvitees();
      prismaMock.user.findUnique.mockImplementation(
        async ({ where }: { where: { email: string } }) =>
          where.email === 'member@example.com'
            ? { id: 'user-2', teams: [{ id: 'm-2' }] }
            : null
      );
      prismaMock.teamInviteEmail.findUnique.mockImplementation(
        async ({ where }: { where: { teamId_email: { email: string } } }) =>
          where.teamId_email.email === 'pending@example.com'
            ? { id: 'existing' }
            : null
      );
      inbound.send.mockImplementation(async ({ to }: { to: string }) => {
        if (to === 'bounce@example.com') {
          throw new Error('bounced');
        }
        return { id: `sent-${to}` };
      });
    });

    it('processes every invitation in order and partitions the outcomes', async () => {
      const result = await inviteMembers(
        request(
          invitation('one@example.com'),
          invitation('member@example.com'),
          invitation('pending@example.com'),
          invitation('bounce@example.com'),
          invitation('two@example.com', TeamRole.ADMIN)
        )
      );

      expect(expectOk(result)).toEqual({
        success: true,
        invited: ['one@example.com', 'two@example.com'],
        skipped: [
          {
            email: 'member@example.com',
            reason: 'User is already a member of this team'
          },
          {
            email: 'pending@example.com',
            reason: 'Invitation already sent to this email'
          },
          {
            email: 'bounce@example.com',
            reason: 'Failed to send invitation email'
          }
        ]
      });
    });

    it('only stores invitations that were not skipped before sending', async () => {
      await inviteMembers(
        request(
          invitation('one@example.com'),
          invitation('member@example.com'),
          invitation('pending@example.com'),
          invitation('bounce@example.com')
        )
      );

      expect(
        prismaMock.teamInviteEmail.create.mock.calls.map(
          ([args]) => args.data.email
        )
      ).toEqual(['one@example.com', 'bounce@example.com']);
    });
  });

  describe('when storing an invitation fails', () => {
    it('fails the whole request with INTERNAL_SERVER_ERROR', async () => {
      signIn();
      prismaMock.team.findFirst.mockResolvedValue(
        callerTeam(TeamRole.OWNER, teamDetails)
      );
      setupNewInvitees();
      prismaMock.teamInviteEmail.create.mockRejectedValue(
        knownRequestError('P2002')
      );

      const result = await inviteMembers(
        request(invitation('new@example.com'))
      );

      expect(expectFailure(result, 'INTERNAL_SERVER_ERROR').message).toMatch(
        PRISMA_INTERNAL_ERROR_MESSAGE
      );
      expect(inbound.send).not.toHaveBeenCalled();
    });
  });
});
