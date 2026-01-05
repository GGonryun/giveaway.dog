'use server';

import { ArrowRight } from 'lucide-react';
import { OrbitingPlatformsSection } from '../marketing/orbiting-platforms';
import { ScrollingTemplatesAnimation } from '../marketing/scrolling-templates-animation';
import { UnifiedPlatformSection } from '../marketing/unified-platform-visual';
import { MarketingHeader } from '@/components/patterns/shared';
import { getServerTheme } from '../theme/get-server-theme';
import { BotCarouselSection } from '../marketing/bot-carousel';
import { EntryMethodsCarouselSection } from '../marketing/entry-methods-carousel';

export const IntegrationsSection = async () => {
  const theme = await getServerTheme();

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
                  Browse integrations <ArrowRight />
                </>
              ),
              href: '/integrations'
            }
          ]}
        />
      </div>

      <ScrollingTemplatesAnimation initialTheme={theme} />
      <section className="w-full flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid lg:grid-cols-2 gap-3 max-w-5xl mx-auto">
            <OrbitingPlatformsSection initialTheme={theme} />
            <UnifiedPlatformSection />
            <BotCarouselSection initialTheme={theme} />
            <EntryMethodsCarouselSection />
          </div>
        </div>
      </section>
    </div>
  );
};
