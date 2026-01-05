import { ArrowRight } from 'lucide-react';
import { OrbitingPlatformsSection } from '../marketing/orbiting-platforms';
import { ScrollingTemplatesAnimation } from '../marketing/scrolling-templates-animation';
import { UnifiedPlatformSection } from '../marketing/unified-platform-visual';
import { MarketingHeader } from '@/components/patterns/shared';
import type { ResolvedTheme } from '../theme/get-server-theme';

interface IntegrationsSectionProps {
  theme: ResolvedTheme;
}

export const IntegrationsSection = async ({
  theme
}: IntegrationsSectionProps) => {
  return (
    <div className="bg-background py-16 md:py-24">
      <div className="text-center mb-6">
        <MarketingHeader
          title={{
            text: 'Seamlessly integrate your favorite platforms',
            highlight: 'favorite platforms'
          }}
          subtitle={{
            text: 'Use verified entries, templates, and integrations to effortlessly connect with your audience across multiple platforms.'
          }}
          actions={[
            {
              label: (
                <>
                  Browse templates <ArrowRight />
                </>
              ),
              href: '/integrations'
            }
          ]}
        />
      </div>

      <ScrollingTemplatesAnimation theme={theme} />
      <section className="w-full flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            <OrbitingPlatformsSection theme={theme} />
            <UnifiedPlatformSection />
          </div>
        </div>
      </section>
    </div>
  );
};
