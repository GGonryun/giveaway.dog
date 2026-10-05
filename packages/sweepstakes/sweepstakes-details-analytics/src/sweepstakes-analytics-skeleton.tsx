import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@giveaway/ui-primitives/card';
import { Skeleton } from '@giveaway/ui-primitives/skeleton';
import { DEFAULT_TIME_SERIES_DURATION } from '@giveaway/app-config/settings';

const TimelineChartSkeleton = () => (
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

const PrizeAllocationChartSkeleton = () => (
  <Card>
    <CardHeader>
      <CardTitle>Prize Allocation Distribution</CardTitle>
      <CardDescription>
        Breakdown of user prize selections across all available prizes
      </CardDescription>

      <div className="flex items-center space-x-6 pt-2">
        <div className="text-sm text-muted-foreground">
          Total Selections: <Skeleton className="inline-block h-4 w-16" />
        </div>
      </div>
    </CardHeader>

    <CardContent className="pt-2">
      <div className="flex items-center justify-center h-[350px]">
        <div className="relative w-[200px] h-[200px]">
          <Skeleton className="absolute inset-0 rounded-full" />
          <div className="absolute inset-[25%] bg-background rounded-full" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export function SweepstakesAnalyticsSkeleton({
  showAllocation = false
}: {
  showAllocation?: boolean;
}) {
  if (showAllocation) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TimelineChartSkeleton />
        <PrizeAllocationChartSkeleton />
      </div>
    );
  }

  return <TimelineChartSkeleton />;
}
