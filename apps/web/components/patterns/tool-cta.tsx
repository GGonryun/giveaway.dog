import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';

interface ToolCtaProps {
  title?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
}

export function ToolCta({
  title = 'Ready to host your own giveaway?',
  description = 'Create professional giveaways with entry verification, custom branding, and advanced analytics. Join thousands of hosts who trust Giveaway.dog.',
  primaryButtonText = 'Get started',
  primaryButtonHref = '/login',
  secondaryButtonText = 'Try The Demo',
  secondaryButtonHref = '/demo/sweepstakes'
}: ToolCtaProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="p-8 md:p-12 text-center space-y-6">
        <h2 className="mx-auto text-2xl font-semibold font-outfit tracking-tight text-foreground sm:text-3xl lg:text-4xl text-balance">
          {title}
        </h2>
        <Typography.Paragraph className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {description}
        </Typography.Paragraph>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="xl" asChild>
            <Link href={primaryButtonHref}>{primaryButtonText}</Link>
          </Button>
          <Button size="xl" variant="outline" asChild>
            <Link href={secondaryButtonHref}>
              {secondaryButtonText} <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
