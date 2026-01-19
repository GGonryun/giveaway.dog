'use client';

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Terminal, Copy, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { IntegrationSchema } from '../../integrations/schemas';
import { useProcedure } from '@/lib/mrpc/hook';
import { useRouter } from 'next/navigation';
import { useActiveTeam } from '@/components/team/use-active-team-page';
import { regenerateDiscordKey } from '../procedures/regenerate-discord-key';
import { Spinner } from '@/components/ui/spinner';

interface DiscordConnectInstructionsProps {
  integration: IntegrationSchema;
  showRegenerateButton?: boolean;
}

export function DiscordConnectInstructions({
  integration,
  showRegenerateButton = false
}: DiscordConnectInstructionsProps) {
  const { slug } = useActiveTeam();
  const router = useRouter();
  const [showKey, setShowKey] = useState(false);
  const [registrationKey, setRegistrationKey] = useState(
    () => integration.state?.id || integration.id
  );

  const regenerate = useProcedure({
    action: regenerateDiscordKey,
    onSuccess(newKey) {
      setRegistrationKey(newKey);
      toast.success('Registration key regenerated successfully');
      router.refresh();
    }
  });

  const handleCopyConnectCommand = () => {
    navigator.clipboard.writeText(`/connect`);
    toast.success('Command copied to clipboard');
  };

  const handleCopyRegistrationKey = () => {
    navigator.clipboard.writeText(registrationKey);
    toast.success('Registration key copied to clipboard');
  };

  const handleRegenerateKey = () => {
    regenerate.run({ integrationId: integration.id, slug });
  };

  return (
    <Alert>
      <Terminal className="h-4 w-4" />
      <AlertTitle>Connect Your Server</AlertTitle>
      <AlertDescription>
        <div className="space-y-2">
          <p className="text-sm">
            Go to your giveaway channel in your Discord server and run{' '}
            <code
              className="bg-muted text-xs p-1 hover:underline cursor-pointer"
              onClick={handleCopyConnectCommand}
            >
              /connect
            </code>
            . Provide the following registration key:
          </p>
          <div className="flex gap-2">
            <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono">
              {showKey ? registrationKey : '•'.repeat(registrationKey.length)}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowKey(!showKey)}
              disabled={regenerate.isLoading}
              title={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={regenerate.isLoading}
              onClick={handleCopyRegistrationKey}
              title="Copy key"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {showRegenerateButton && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleRegenerateKey}
              disabled={regenerate.isLoading}
            >
              {regenerate.isLoading ? <Spinner size="2xs" /> : <RotateCcw />}
              {regenerate.isLoading ? 'Regenerating...' : 'Regenerate Key'}
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
