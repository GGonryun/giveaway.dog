'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@giveaway/ui-primitives/card';
import { Button } from '@giveaway/ui-primitives/button';
import { Spinner } from '@giveaway/ui-primitives/spinner';
import { Badge } from '@giveaway/ui-primitives/badge';
import { useProcedure } from '@giveaway/rpc-client/hook';
import acceptInvite from '@/procedures/teams/accept-invite';
import { EasterEggLogo } from '@/components/patterns/easter-egg-logo';
import { toast } from 'sonner';
import { CheckCircle } from 'lucide-react';
import { TeamRole } from '@prisma/client';
import { UNKNOWN_USER_NAME } from '@giveaway/app-config/settings';
import Image from 'next/image';

interface InviteDetails {
  teamName: string;
  teamLogo: string;
  teamSlug: string;
  role: TeamRole | null;
  isEmailInvite: boolean;
}

interface InviteAcceptanceProps {
  code: string;
  inviteDetails: InviteDetails;
}

export const InviteAcceptance: React.FC<InviteAcceptanceProps> = ({
  code,
  inviteDetails
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [accepted, setAccepted] = useState(false);

  const { isLoading: isAccepting, run: accept } = useProcedure({
    action: acceptInvite,
    onSuccess(data) {
      setAccepted(true);
      toast.success(`Successfully joined ${data.teamName}!`);
      setTimeout(() => {
        router.push('/app');
      }, 1500);
    },
    onFailure(error) {
      toast.error(error.message);
    }
  });

  const handleAccept = () => {
    accept({ code });
  };

  const handleLogin = () => {
    const search = new URLSearchParams([['redirectTo', pathname]]);
    router.push(`/login?${search.toString()}`);
  };

  if (status === 'loading') {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </CardContent>
      </Card>
    );
  }

  if (accepted) {
    return (
      <Card className="w-full max-w-md border-green-200 bg-green-50/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Welcome to the Team!</CardTitle>
          <CardDescription className="text-base">
            You're now a member of {inviteDetails.teamName}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Redirecting you to your teams...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <div className="w-full max-w-md space-y-4">
        <Card>
          <EasterEggLogo size={120} />
          <CardHeader className="text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <div className="text-4xl">{inviteDetails.teamLogo}</div>
            </div>
            <CardTitle className="text-2xl">You've Been Invited!</CardTitle>
            <CardDescription className="text-base">
              Join{' '}
              <span className="font-semibold">{inviteDetails.teamName}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {inviteDetails.role && (
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">Role:</span>
                <Badge>{inviteDetails.role}</Badge>
              </div>
            )}
            <p className="text-center text-sm text-muted-foreground">
              You need to be signed in to accept this invitation.
            </p>
            <Button className="w-full" size="lg" onClick={handleLogin}>
              Sign In or Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="flex justify-center">
        <EasterEggLogo size={120} />
      </div>
      <Card>
        <CardHeader className="text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Image
              className="border rounded-full"
              src={inviteDetails.teamLogo}
              alt={`${inviteDetails.teamName} Logo`}
              width={64}
              height={64}
            />
          </div>
          <CardTitle className="text-2xl">You've Been Invited!</CardTitle>
          <CardDescription className="text-base">
            Join <span className="font-semibold">{inviteDetails.teamName}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {inviteDetails.role && (
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">
                You'll join as:
              </span>
              <Badge>{inviteDetails.role}</Badge>
            </div>
          )}
          <div className="rounded-lg border bg-muted/50 p-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Signed in as
            </p>
            <p className="mt-1 text-base font-semibold">
              {session.user?.email || session.user?.name || UNKNOWN_USER_NAME}
            </p>
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={handleAccept}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Accepting...
              </>
            ) : (
              'Accept Invitation'
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            By accepting, you'll become a member of{' '}
            <span className="font-semibold">{inviteDetails.teamName}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
