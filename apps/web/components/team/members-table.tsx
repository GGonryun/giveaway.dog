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
import { Button } from '@giveaway/ui-primitives/button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@giveaway/ui-primitives/avatar';
import { Badge } from '@giveaway/ui-primitives/badge';
import { MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { RemoveMemberDialog } from './remove-member-dialog';
import { EditMemberDialog } from './edit-member-dialog';
import { TeamRole } from '@prisma/client';
import { formatDistance } from 'date-fns';
import { ObfuscatedEmail } from '@giveaway/ui-primitives/obfuscated-email';

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

interface MembersTableProps {
  slug: string;
  members: Member[];
  onMemberRemoved: () => void;
}

export const MembersTable: React.FC<MembersTableProps> = ({
  slug,
  members,
  onMemberRemoved
}) => {
  const [removeDialog, setRemoveDialog] = useState<{
    open: boolean;
    member: Member | null;
  }>({ open: false, member: null });

  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    member: Member | null;
  }>({ open: false, member: null });

  const handleRemoveClick = (member: Member) => {
    setRemoveDialog({ open: true, member });
  };

  const handleEditClick = (member: Member) => {
    setEditDialog({ open: true, member });
  };

  const handleRemoveSuccess = () => {
    setRemoveDialog({ open: false, member: null });
    onMemberRemoved();
  };

  const handleEditSuccess = () => {
    setEditDialog({ open: false, member: null });
    onMemberRemoved();
  };

  const isOwner = (role: TeamRole) => role === TeamRole.OWNER;
  const isLastMember = members.length === 1;

  const getRemovalBlockReason = (member: Member): string | null => {
    if (isOwner(member.role)) {
      return 'Cannot remove the team owner';
    }
    if (isLastMember) {
      return 'Cannot remove the last member of the team';
    }
    return null;
  };

  const getRoleBadgeVariant = (role: TeamRole) => {
    switch (role) {
      case TeamRole.OWNER:
        return 'default';
      case TeamRole.ADMIN:
        return 'secondary';
      case TeamRole.MEMBER:
        return 'outline';
      case TeamRole.GUEST:
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (members.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">No team members found</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Member</TableHead>
              <TableHead className="hidden sm:table-cell">Role</TableHead>
              <TableHead className="hidden lg:table-cell">Joined</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.user.image || undefined} />
                    <AvatarFallback>
                      {member.user.emoji ||
                        member.user.name?.charAt(0)?.toUpperCase() ||
                        member.user.email?.charAt(0)?.toUpperCase() ||
                        '?'}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">
                  <div>
                    <div className="font-medium">
                      {member.user.name || 'Unnamed User'}
                    </div>
                    <div className="text-xs text-muted-foreground/70">
                      <ObfuscatedEmail email={member.user.email} />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={getRoleBadgeVariant(member.role)}>
                    {member.role}
                  </Badge>
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {formatDistance(new Date(member.createdAt), new Date(), {
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
                      <DropdownMenuItem onClick={() => handleEditClick(member)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Member
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleRemoveClick(member)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {removeDialog.member && (
        <RemoveMemberDialog
          open={removeDialog.open}
          onOpenChange={(open) => setRemoveDialog({ ...removeDialog, open })}
          slug={slug}
          membershipId={removeDialog.member.id}
          memberName={removeDialog.member.user.name || ''}
          memberEmail={removeDialog.member.user.email || ''}
          blockReason={getRemovalBlockReason(removeDialog.member)}
          onSuccess={handleRemoveSuccess}
        />
      )}

      {editDialog.member && (
        <EditMemberDialog
          open={editDialog.open}
          onOpenChange={(open) => setEditDialog({ ...editDialog, open })}
          slug={slug}
          membershipId={editDialog.member.id}
          memberName={editDialog.member.user.name || ''}
          memberEmail={editDialog.member.user.email || ''}
          currentRole={editDialog.member.role}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};
