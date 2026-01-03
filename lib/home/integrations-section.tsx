import { Typography } from '@/components/ui/typography';
import { OrbitingPlatformsSection } from '../marketing/orbiting-platforms';
import { ScrollingTemplatesAnimation } from '../marketing/scrolling-templates-animation';
import { UnifiedPlatformSection } from '../marketing/unified-platform-visual';

export const IntegrationsSection = () => {
  return (
    <div className="bg-background py-16 md:py-24">
      <div className="text-center mb-6">
        <h1 className="mx-auto max-w-2xl text-4xl font-semibold font-outfit tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance mb-4">
          Seamlessly integrate your{' '}
          <span className="text-primary">favorite platforms</span>
        </h1>
        <Typography.Paragraph className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Use verified entries, templates, and integrations to effortlessly
          connect with your audience across multiple platforms.
        </Typography.Paragraph>
      </div>

      <ScrollingTemplatesAnimation />
      <section className="w-full flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            <OrbitingPlatformsSection />
            <UnifiedPlatformSection />
          </div>
        </div>
      </section>
    </div>
  );
};
