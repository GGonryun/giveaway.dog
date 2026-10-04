'use client';

import { SupportedIntegrations } from '@/lib/home/supported-integrations';
import type { ResolvedTheme } from '@/lib/theme/get-server-theme';
import { CAROUSEL_PLATFORMS } from '@giveaway/platform-catalog/platform-icons';

interface IntegrationsShowcaseProps {
  initialTheme: ResolvedTheme;
}

export function IntegrationsShowcase({
  initialTheme
}: IntegrationsShowcaseProps) {
  return (
    <div className="space-y-12">
      <SupportedIntegrations
        initialTheme={initialTheme}
        platformIds={CAROUSEL_PLATFORMS}
        showSeeAllButton={false}
      />
    </div>
  );
}
