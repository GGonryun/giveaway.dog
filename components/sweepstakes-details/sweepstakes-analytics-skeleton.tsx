import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DEFAULT_TIME_SERIES_DURATION } from '@/lib/settings';

export function SweepstakesAnalyticsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Entries Timeline</CardTitle>
        <CardDescription>
          Total entry volume over the last {DEFAULT_TIME_SERIES_DURATION} days
        </CardDescription>

        <div className="flex items-center space-x-6 pt-2">
          <div className="text-sm text-muted-foreground">
            Total Entries: <Skeleton className="inline-block h-4 w-16" />
          </div>
          <div className="text-sm text-muted-foreground">
            Unique Users: <Skeleton className="inline-block h-4 w-16" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="space-y-4">
          <div className="h-[300px] bg-accent rounded-lg animate-pulse flex items-end justify-around p-4 gap-1">
            {Array.from({ length: 14 }).map((_, i) => (
              <div
                key={i}
                className="bg-muted rounded-t w-full"
                style={{
                  height: `${Math.random() * 60 + 40}%`,
                  opacity: 0.6
                }}
              />
            ))}
          </div>
          <div className="flex justify-between px-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
