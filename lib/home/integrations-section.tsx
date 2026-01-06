'use server';

import { ArrowRight } from 'lucide-react';
import { ScrollingTemplatesAnimation } from '../marketing/scrolling-templates-animation';
import { MarketingHeader } from '@/components/patterns/shared';
import { getServerTheme } from '../theme/get-server-theme';
import { SupportedIntegrations } from './supported-integrations';

export const IntegrationsSection = async () => {
  const theme = await getServerTheme();

  return (
    <div className="bg-gradient-to-b from-primary/12 to-background relative pt-16 pb-16 md:pt-24 overflow-hidden">
      <div className="relative z-10 text-center mb-6">
        <MarketingHeader
          title={{
            text: 'Seamlessly integrate your favorite platforms',
            highlight: 'your favorite platforms'
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
              href: '/learn/templates'
            }
          ]}
        />
      </div>

      <ScrollingTemplatesAnimation initialTheme={theme} />
      <section className="relative z-10 w-full flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <SupportedIntegrations initialTheme={theme} />
        </div>
      </section>
    </div>
  );
};
