import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function SweepstakesPromotionSkeleton() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Social Sharing</CardTitle>
          <CardDescription>
            Share your sweepstakes across social media platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>UTM Link Builder</CardTitle>
          <CardDescription>
            Create trackable links with UTM parameters for campaign analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>

          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <div className="grid gap-2 mt-2 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Direct Links</CardTitle>
          <CardDescription>
            Copy and share direct links to your sweepstakes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <Skeleton className="h-4 w-32 mb-1" />
            <div className="flex items-center space-x-2 mt-1">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-10" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Template</CardTitle>
          <CardDescription>
            Ready-to-use email template for your campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
          <div className="mt-2 flex justify-end">
            <Skeleton className="h-9 w-32" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>QR Code</CardTitle>
          <CardDescription>
            Generate QR codes for offline promotion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="w-32 h-32 mx-auto bg-accent rounded-lg animate-pulse" />
            <div className="space-y-2">
              <Skeleton className="h-10 w-32 mx-auto" />
              <Skeleton className="h-3 w-48 mx-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
