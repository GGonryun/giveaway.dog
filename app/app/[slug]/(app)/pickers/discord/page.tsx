import { Outline } from '@/components/app/outline';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HourglassIcon } from 'lucide-react';
import Link from 'next/link';

interface DiscordPickersPageProps {
  params: Promise<{ slug: string }>;
}

export default async function DiscordPickersPage({
  params
}: DiscordPickersPageProps) {
  const { slug } = await params;

  return (
    <Outline title="Discord Pickers">
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 max-w-md text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <HourglassIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Discord Pickers</h2>
          <p className="text-muted-foreground mb-6">
            Discord pickers are not yet available. Check back soon for updates!
          </p>
          <Button asChild variant="outline">
            <Link href={`/app/${slug}/pickers`}>Back to Pickers</Link>
          </Button>
        </Card>
      </div>
    </Outline>
  );
}
