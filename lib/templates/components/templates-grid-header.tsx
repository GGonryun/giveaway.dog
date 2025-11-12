import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const TemplatesGridHeader: React.FC<{ slug: string }> = ({ slug }) => {
  const templatesRoute = `/app/${slug}/templates`;

  return (
    <div className="flex flex-row items-center justify-between">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <Typography.Header level={3}>Start with a Template</Typography.Header>
      </div>
      <Button size="sm" asChild>
        <Link href={templatesRoute}>
          View All
          <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </Button>
    </div>
  );
};
