'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InviteFormCard } from '@/components/team/invite-form-card';
import { MembersTable } from '@/components/team/members-table';
import { PendingInvitationsTable } from '@/components/team/pending-invitations-table';
import { TeamInviteLinkProvider } from '@/lib/invites/context/team-invite-link-context';
import { useProcedure } from '@/lib/mrpc/hook';
import getTeamMembers from '@/procedures/teams/get-team-members';
import getTeamInvitations from '@/procedures/teams/get-team-invitations';
import getInviteLink from '@/procedures/teams/get-invite-link';
import regenerateInviteLink from '@/procedures/teams/regenerate-invite-link';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

interface TeamRolesProps {
  slug: string;
}

export function TeamRoles({ slug }: TeamRolesProps) {
  const { data: session } = useSession();
  const [refreshKey, setRefreshKey] = useState(0);
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const {
    isLoading: membersLoading,
    isPending: membersPending,
    run: fetchMembers
  } = useProcedure({
    action: getTeamMembers,
    onSuccess(data) {
      setMembers(data);
    },
    onFailure(error) {
      toast.error(`Failed to load members: ${error.message}`);
    }
  });

  const {
    isLoading: invitationsLoading,
    isPending: invitationsPending,
    run: fetchInvitations
  } = useProcedure({
    action: getTeamInvitations,
    onSuccess(data) {
      setInvitations(data);
    },
    onFailure(error) {
      toast.error(`Failed to load invitations: ${error.message}`);
    }
  });

  const {
    isLoading: inviteLinkLoading,
    run: fetchInviteLink
  } = useProcedure({
    action: getInviteLink,
    onSuccess(data) {
      setInviteUrl(data.url);
      setInviteCode(data.code);
    },
    onFailure(error) {
      toast.error(`Failed to load invite link: ${error.message}`);
    }
  });

  const { isLoading: isRegenerating, run: handleRegenerateLink } = useProcedure(
    {
      action: regenerateInviteLink,
      onSuccess(data) {
        setInviteUrl(data.url);
        setInviteCode(data.code);
        toast.success('Invite link regenerated successfully');
      },
      onFailure(error) {
        toast.error(`Failed to regenerate invite link: ${error.message}`);
      }
    }
  );

  useEffect(() => {
    fetchMembers({ slug });
    fetchInvitations({ slug });
    fetchInviteLink({ slug });
  }, [slug, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const isLoading =
    membersLoading ||
    membersPending ||
    invitationsLoading ||
    invitationsPending;

  return (
    <TeamInviteLinkProvider
      inviteUrl={inviteUrl}
      inviteCode={inviteCode}
      isLoading={inviteLinkLoading || isRegenerating}
      regenerate={() => handleRegenerateLink({ slug })}
    >
      <div className="space-y-6">
        <InviteFormCard slug={slug} onInvitesSent={handleRefresh} />

        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage your team members and pending invitations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Spinner className="h-8 w-8" />
              </div>
            ) : (
              <Tabs defaultValue="members" className="w-full">
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="members" className="flex-1 sm:flex-none">
                    Members ({members?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger
                    value="invitations"
                    className="flex-1 sm:flex-none"
                  >
                    Pending ({invitations?.length || 0})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="members">
                  <MembersTable
                    slug={slug}
                    members={members || []}
                    currentUserId={session?.user?.id || ''}
                    onMemberRemoved={handleRefresh}
                  />
                </TabsContent>
                <TabsContent value="invitations">
                  <PendingInvitationsTable
                    slug={slug}
                    invitations={invitations || []}
                    onInvitationRevoked={handleRefresh}
                  />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </TeamInviteLinkProvider>
  );
}
