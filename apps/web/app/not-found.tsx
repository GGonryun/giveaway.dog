import { EasterEggLogo } from '@giveaway/ui-brand/easter-egg-logo';
import { Button } from '@giveaway/ui-primitives/button';
import { Typography } from '@giveaway/ui-primitives/typography';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="w-full h-full min-h-screen flex items-center justify-center bg-background">
      <div className="container max-w-md mx-auto text-center px-4">
        <div className="space-y-6">
          <div className="space-y-2">
            <EasterEggLogo size={150} />
            <Typography.Header
              level={1}
              className="text-6xl font-bold text-primary"
            >
              404
            </Typography.Header>
            <Typography.Header
              level={2}
              className="text-2xl text-muted-foreground"
            >
              Content not found
            </Typography.Header>
          </div>

          <Typography.Paragraph className="text-muted-foreground max-w-sm mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </Typography.Paragraph>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/">Go home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/browse">Giveaways</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
