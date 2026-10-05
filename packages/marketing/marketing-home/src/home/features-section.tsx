'use server';

import { OrbitingPlatformsSection } from '@giveaway/marketing-animations/orbiting-platforms';
import { UnifiedPlatformSection } from '@giveaway/marketing-animations/unified-platform-visual';
import { getServerTheme } from '@giveaway/theme-server/get-server-theme';
import { BotCarouselSection } from '@giveaway/marketing-animations/bot-carousel';
import { EntryMethodsCarouselSection } from '@giveaway/marketing-animations/entry-methods-carousel';
import { MarketingPageHeader } from '@giveaway/marketing-ui/marketing/marketing-page-header';

export const FeaturesSection = async () => {
  const theme = await getServerTheme();

  return (
    <div className="bg-gradient-to-b from-background to-primary/12 w-full flex items-center justify-center">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <section className="relative z-10 w-full flex items-center justify-center pt-4 sm:pt-6">
          <div className="grid lg:grid-cols-2 gap-3 max-w-5xl mx-auto">
            <OrbitingPlatformsSection initialTheme={theme} />
            <UnifiedPlatformSection />
            <BotCarouselSection initialTheme={theme} />
            <EntryMethodsCarouselSection />
          </div>
        </section>
      </div>
    </div>
  );
};
