'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { SocialXIcon } from '@/components/ui/patterns/x-icon';
import { useState } from 'react';
import { connectTwitter } from '@/lib/integrations/procedures/connect-twitter';
import { disconnectTwitter } from '@/lib/integrations/procedures/disconnect-twitter';
import { useRouter } from 'next/navigation';
import { useProcedure } from '@/lib/mrpc/hook';
import { toast } from 'sonner';
import { useActiveTeam } from '@/components/team/use-active-team-page';
import { IntegrationSchema } from '../schemas';

interface TwitterCardProps {
  integration?: IntegrationSchema;
}

export function TwitterCard({ integration }: TwitterCardProps) {
  const { slug } = useActiveTeam();
  const router = useRouter();

  const connect = useProcedure({
    action: connectTwitter,
    onSuccess(data) {
      toast('Redirecting to Twitter for authentication...');
      router.push(data.authUrl);
    },
    onFailure(error) {
      toast(`Failed to initiate connection: ${error.message}`);
    }
  });

  const disconnect = useProcedure({
    action: disconnectTwitter,
    onSuccess() {
      toast('Twitter disconnected successfully');
      router.refresh();
    },
    onFailure(error) {
      toast(`Failed to disconnect Twitter: ${error.message}`);
    }
  });

  return (
    <Card className="relative">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <SocialXIcon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-base">Twitter / X</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Social media platform
              </CardDescription>
            </div>
          </div>
          {integration && (
            <Badge variant="success" className="text-xs">
              Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {integration ? (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium">@{integration.label}</p>
              <p className="text-xs text-muted-foreground">
                Import entries, sync engagement, and manage giveaways
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a
                  href={`https://twitter.com/${integration.label}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Profile
                </a>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={() => disconnect.run({ slug })}
                disabled={disconnect.isLoading}
              >
                {disconnect.isLoading ? 'Removing...' : 'Disconnect'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Import entries from posts, sync likes, reposts, and replies
            </p>
            <Button
              onClick={() => connect.run({ slug })}
              disabled={connect.isLoading}
              className="w-full"
              size="sm"
            >
              {connect.isLoading ? 'Connecting...' : 'Connect'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
