'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTeamInviteLink } from '@/lib/invites/context/team-invite-link-context';
import { toast } from 'sonner';
import { Copy, RefreshCw, Info, AlertTriangle } from 'lucide-react';

interface InviteLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InviteLinkModal: React.FC<InviteLinkModalProps> = ({
  open,
  onOpenChange
}) => {
  const { inviteUrl, isLoading, regenerate } = useTeamInviteLink();

  const handleCopy = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      toast.success('Link copied to clipboard');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Team Invite Link</DialogTitle>
          <DialogDescription>
            Share this link with anyone you want to invite to your team. Anyone
            with this link can join.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex h-20 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <Input
                  value={inviteUrl || ''}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  title="Copy link"
                  disabled={!inviteUrl}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <Alert variant="default">
                <Info className="h-4 w-4" />
                <AlertTitle>How to use this link</AlertTitle>
                <AlertDescription>
                  <ul className="list-inside list-disc space-y-1">
                    <li>Share this link with team members</li>
                    <li>They'll need to sign in to accept</li>
                    <li>New members will have MEMBER role by default</li>
                    <li>Regenerate the link to invalidate the old one</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Alert variant="error">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Regenerating this link will make the current link invalid.
                  Anyone with the old link won't be able to join.
                </AlertDescription>
              </Alert>
            </>
          )}
        </div>

        <DialogFooter>
          <div className="flex gap-2">
            <Button variant="outline" onClick={regenerate} disabled={isLoading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
