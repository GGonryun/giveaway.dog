'use server';

import { ArrowRight } from 'lucide-react';
import { MarketingHeader } from '@/components/patterns/shared';
import { getServerTheme } from '../theme/get-server-theme';

export const TemplatesSection = async () => {
  const theme = await getServerTheme();

  return (
    <div className="bg-gradient-to-b from-background to-primary/12 py-16 md:py-24">
      <div className="text-center mb-6">
        <MarketingHeader
          title={{
            text: 'Get started with pre-built templates',
            highlight: 'pre-built templates'
          }}
          subtitle={{
            text: 'Choose from a variety of pre-built templates to quickly launch your campaigns and engage your audience.'
          }}
          actions={[
            {
              label: (
                <>
                  Browse templates <ArrowRight />
                </>
              ),
              href: '/templates'
            }
          ]}
        />
      </div>
    </div>
  );
};
