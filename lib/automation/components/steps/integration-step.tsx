'use client';

import { Button } from '@/components/ui/button';
import { TwitterPostPermissionBanner } from '../twitter-post-permission-banner';
import { SocialXIcon } from '@/lib/integrations/components/icons/x-icon';
import { AlertCircle } from 'lucide-react';

interface AutomatedPostIntegrationStep {
  hasTwitterIntegration: boolean;
  hasPostingPermission: boolean;
  slug: string;
  isSweepstakesLive: boolean;
  onNext: () => void;
}

export function AutomatedPostIntegrationStep({
  hasTwitterIntegration,
  hasPostingPermission,
  slug,
  isSweepstakesLive,
  onNext
}: AutomatedPostIntegrationStep) {
  return (
    <div className="space-y-4">
      <div className="px-4">
        <TwitterPostPermissionBanner
          hasTwitterIntegration={hasTwitterIntegration}
          hasPostingPermission={hasPostingPermission}
          slug={slug}
        />
      </div>

      {isSweepstakesLive && (
        <div className="px-4">
          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900">
                Your giveaway is live
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Your post will go out immediately because your sweepstakes is
                live
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="px-4">
        <Button onClick={onNext} variant="outline" className="w-full">
          <SocialXIcon className="h-4 w-4 mr-2" />
          Post to Twitter
        </Button>
      </div>
    </div>
  );
}
