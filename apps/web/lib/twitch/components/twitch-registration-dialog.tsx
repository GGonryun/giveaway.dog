'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@giveaway/ui-primitives/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@giveaway/ui-primitives/alert';
import { Button } from '@giveaway/ui-primitives/button';
import { ShieldCheck, Copy, Check, Plug } from 'lucide-react';
import { useProcedure } from '@/lib/mrpc/hook';
import { connectTwitch } from '../procedures/connect-twitch';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';

const TWITCH_BOT_USERNAME = process.env.NEXT_PUBLIC_TWITCH_BOT_USERNAME;

interface TwitchRegistrationDialogProps {
  open: boolean;
  slug: string;
  onOpenChange: (open: boolean) => void;
}

export function TwitchRegistrationDialog({
  open,
  slug,
  onOpenChange
}: TwitchRegistrationDialogProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const connect = useProcedure({
    action: connectTwitch,
    onSuccess(data) {
      toast('Redirecting to Twitch for authentication...');
      router.push(data.authUrl);
    },
    onFailure(error) {
      toast.error(`Failed to initiate connection: ${error.message}`);
    }
  });

  const handleConnect = () => {
    connect.run({
      slug,
      features: []
    });
  };

  const handleCopyCommand = async () => {
    const command = `/mod ${TWITCH_BOT_USERNAME}`;
    await navigator.clipboard.writeText(command);
    setCopied(true);
    toast.success('Command copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect Twitch Channel</DialogTitle>
          <DialogDescription>
            Connect your Twitch channel to enable all integration features
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Add Bot as Moderator</AlertTitle>
          <AlertDescription className="space-y-3">
            <p className="text-sm">
              For chat commands to work, add{' '}
              <strong>{TWITCH_BOT_USERNAME}</strong> as a moderator in your
              channel.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono">
                /mod {TWITCH_BOT_USERNAME}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCommand}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Run this command in your Twitch chat, or go to Creator Dashboard
              &rarr; Settings &rarr; Moderation
            </p>
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={connect.isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleConnect} disabled={connect.isLoading}>
            {!connect.isLoading && <Plug className="h-4 w-4 mr-2" />}
            {connect.isLoading ? 'Connecting...' : 'Connect with Twitch'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
