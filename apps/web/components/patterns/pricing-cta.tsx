import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';

export function CallToAction() {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 mb-12">
      <CardContent className="p-8 md:p-12 text-center space-y-6">
        <h1 className="mx-auto text-2xl font-semibold font-outfit tracking-tight text-foreground sm:text-3xl lg:text-4xl text-balance">
          Ready to <span className="text-primary">save time</span>?
        </h1>
        <Typography.Paragraph className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Join busy hosts who save time and effort without sacrificing their
          commitment to their community.
        </Typography.Paragraph>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="xl" asChild>
            <Link href="/login">Get started</Link>
          </Button>
          <Button size="xl" variant="outline" asChild>
            <Link href="/demo/sweepstakes">
              Try The Demo <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
