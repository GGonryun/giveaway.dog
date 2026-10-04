'use client';

import { Button } from '@giveaway/ui-primitives/button';
import { SocialBlueskyIcon } from '@/lib/integrations/components/icons/bluesky-icon';
import { SocialDiscordIcon } from '@/lib/integrations/components/icons/discord-icon';
import { AlertCircle } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@giveaway/ui-primitives/alert';

interface AutomatedPostIntegrationStep {
  isSweepstakesLive: boolean;
  onSelectBluesky: () => void;
  onSelectDiscord: () => void;
}

export function AutomatedPostIntegrationStep({
  isSweepstakesLive,
  onSelectBluesky,
  onSelectDiscord
}: AutomatedPostIntegrationStep) {
  return (
    <div className="space-y-4">
      {isSweepstakesLive && (
        <div className="px-4">
          <Alert>
            <AlertCircle />
            <AlertTitle>Your giveaway is live</AlertTitle>
            <AlertDescription>
              Your post will go out immediately because your sweepstakes is live
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="px-4 space-y-2">
        <Button onClick={onSelectBluesky} variant="outline" className="w-full">
          <SocialBlueskyIcon className="h-4 w-4 mr-2" />
          Post to Bluesky
        </Button>
        <Button onClick={onSelectDiscord} variant="outline" className="w-full">
          <SocialDiscordIcon className="h-4 w-4 mr-2" />
          Post to Discord
        </Button>
      </div>
    </div>
  );
}
