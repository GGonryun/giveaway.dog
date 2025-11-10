'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useProcedure } from '@/lib/mrpc/hook';
import updateMemberRole from '@/procedures/teams/update-member-role';
import { toast } from 'sonner';
import { TeamRole } from '@prisma/client';
import { useState } from 'react';

interface EditMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  membershipId: string;
  memberName: string;
  memberEmail: string;
  currentRole: TeamRole;
  onSuccess: () => void;
}

export const EditMemberDialog: React.FC<EditMemberDialogProps> = ({
  open,
  onOpenChange,
  slug,
  membershipId,
  memberName,
  memberEmail,
  currentRole,
  onSuccess
}) => {
  const [selectedRole, setSelectedRole] = useState<TeamRole>(currentRole);

  const { isLoading, run: updateRole } = useProcedure({
    action: updateMemberRole,
    onSuccess() {
      toast.success('Member role updated successfully');
      onSuccess();
      onOpenChange(false);
    },
    onFailure(error) {
      toast.error(error.message);
    }
  });

  const handleSubmit = () => {
    if (selectedRole === currentRole) {
      toast.info('No changes to save');
      onOpenChange(false);
      return;
    }
    updateRole({ slug, membershipId, role: selectedRole });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Member Role</DialogTitle>
          <DialogDescription>
            Change the role for {memberName || memberEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as TeamRole)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TeamRole.GUEST}>Guest</SelectItem>
                <SelectItem value={TeamRole.MEMBER}>Member</SelectItem>
                <SelectItem value={TeamRole.ADMIN}>Admin</SelectItem>
                <SelectItem value={TeamRole.OWNER}>Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border bg-muted/50 p-3 text-sm">
            <p className="text-muted-foreground">
              <strong>Guest:</strong> Read-only access, no permissions
            </p>
            <p className="text-muted-foreground">
              <strong>Member:</strong> Can view team members
            </p>
            <p className="text-muted-foreground">
              <strong>Admin:</strong> Can invite and remove members
            </p>
            <p className="text-muted-foreground">
              <strong>Owner:</strong> Full control over the team
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
