'use client';

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Terminal, Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { IntegrationSchema } from '../../integrations/schemas';

interface DiscordConnectInstructionsProps {
  integration: IntegrationSchema;
}

export function DiscordConnectInstructions({
  integration
}: DiscordConnectInstructionsProps) {
  const [showKey, setShowKey] = useState(false);
  const registrationKey = integration.state?.id || integration.id;

  const handleCopyConnectCommand = () => {
    navigator.clipboard.writeText(`/connect`);
    toast.success('Command copied to clipboard');
  };

  const handleCopyRegistrationKey = () => {
    navigator.clipboard.writeText(registrationKey);
    toast.success('Registration key copied to clipboard');
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
              onClick={handleCopyRegistrationKey}
              title="Copy key"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
