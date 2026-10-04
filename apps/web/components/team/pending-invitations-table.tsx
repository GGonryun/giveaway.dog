'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@giveaway/ui-primitives/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@giveaway/ui-primitives/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@giveaway/ui-primitives/alert-dialog';
import { Button } from '@giveaway/ui-primitives/button';
import { Badge } from '@giveaway/ui-primitives/badge';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useProcedure } from '@/lib/mrpc/hook';
import revokeInvitation from '@/procedures/teams/revoke-invitation';
import { toast } from 'sonner';
import { TeamRole } from '@prisma/client';
import { formatDistance } from 'date-fns';

interface Invitation {
  id: string;
  email: string;
  role: TeamRole;
  createdAt: Date;
}

interface PendingInvitationsTableProps {
  slug: string;
  invitations: Invitation[];
  onInvitationRevoked: () => void;
}

export const PendingInvitationsTable: React.FC<
  PendingInvitationsTableProps
> = ({ slug, invitations, onInvitationRevoked }) => {
  const [revokeDialog, setRevokeDialog] = useState<{
    open: boolean;
    invitation: Invitation | null;
  }>({ open: false, invitation: null });

  const { isLoading: isRevoking, run: revoke } = useProcedure({
    action: revokeInvitation,
    onSuccess() {
      toast.success('Invitation revoked successfully');
      setRevokeDialog({ open: false, invitation: null });
      onInvitationRevoked();
    },
    onFailure(error) {
      toast.error(error.message);
    }
  });

  const handleRevokeClick = (invitation: Invitation) => {
    setRevokeDialog({ open: true, invitation });
  };

  const handleRevoke = () => {
    if (revokeDialog.invitation) {
      revoke({ slug, invitationId: revokeDialog.invitation.id });
    }
  };

  const getRoleBadgeVariant = (role: TeamRole) => {
    switch (role) {
      case TeamRole.OWNER:
        return 'default';
      case TeamRole.ADMIN:
        return 'secondary';
      case TeamRole.MEMBER:
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (invitations.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">No pending invitations</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead className="hidden sm:table-cell">Role</TableHead>
              <TableHead className="hidden md:table-cell">Invited</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell className="font-medium">
                  <div>
                    <div>{invitation.email}</div>
                    <div className="text-xs text-muted-foreground sm:hidden">
                      <Badge
                        variant={getRoleBadgeVariant(invitation.role)}
                        className="mt-1"
                      >
                        {invitation.role}
                      </Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={getRoleBadgeVariant(invitation.role)}>
                    {invitation.role}
                  </Badge>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {formatDistance(new Date(invitation.createdAt), new Date(), {
                    addSuffix: true
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleRevokeClick(invitation)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Revoke Invitation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={revokeDialog.open}
        onOpenChange={(open) => setRevokeDialog({ ...revokeDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the invitation for{' '}
              <span className="font-semibold">
                {revokeDialog.invitation?.email}
              </span>
              ? They will no longer be able to use their invitation link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={isRevoking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRevoking ? 'Revoking...' : 'Revoke Invitation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
