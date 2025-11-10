'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
import regenerateInviteLink from '@/procedures/teams/regenerate-invite-link';
import { toast } from 'sonner';
import { TeamRole } from '@prisma/client';

interface Member {
  id: string;
  userId: string;
  role: TeamRole;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    emoji: string | null;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: TeamRole;
  createdAt: Date;
}

interface TeamRolesProps {
  slug: string;
  initialMembers: Member[];
  initialInvitations: Invitation[];
  initialInviteUrl: string;
  initialInviteCode: string;
}

export function TeamRoles({
  slug,
  initialMembers,
  initialInvitations,
  initialInviteUrl,
  initialInviteCode
}: TeamRolesProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const { isLoading: isRegenerating, run: handleRegenerateLink } = useProcedure(
    {
      action: regenerateInviteLink,
      onSuccess() {
        toast.success('Invite link regenerated successfully');
        router.refresh();
      },
      onFailure(error) {
        toast.error(`Failed to regenerate invite link: ${error.message}`);
      }
    }
  );

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <TeamInviteLinkProvider
      inviteUrl={initialInviteUrl}
      inviteCode={initialInviteCode}
      isLoading={isRegenerating}
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
            <Tabs defaultValue="members" className="w-full">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="members" className="flex-1 sm:flex-none">
                  Members ({initialMembers.length})
                </TabsTrigger>
                <TabsTrigger
                  value="invitations"
                  className="flex-1 sm:flex-none"
                >
                  Pending ({initialInvitations.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="members">
                <MembersTable
                  slug={slug}
                  members={initialMembers}
                  currentUserId={session?.user?.id || ''}
                  onMemberRemoved={handleRefresh}
                />
              </TabsContent>
              <TabsContent value="invitations">
                <PendingInvitationsTable
                  slug={slug}
                  invitations={initialInvitations}
                  onInvitationRevoked={handleRefresh}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </TeamInviteLinkProvider>
  );
}
