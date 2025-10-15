import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function SweepstakesWinnersSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
          <div className="text-center sm:text-left">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  <Skeleton className="h-5 w-32" />
                </CardTitle>
                <Skeleton className="h-5 w-16" />
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="border rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>

                <div className="flex flex-col items-center justify-center min-h-[80px] p-3 border-2 border-dashed border-muted rounded-lg">
                  <div className="space-y-2 w-full">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>

                    <div className="pt-2 border-t space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-28" />
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <div>
                        <div className="flex justify-between text-xs mb-0.5">
                          <Skeleton className="h-3 w-12" />
                          <Skeleton className="h-3 w-8" />
                        </div>
                        <Skeleton className="h-1.5 w-full rounded-full" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-0.5">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-8" />
                        </div>
                        <Skeleton className="h-1.5 w-full rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                <Skeleton className="h-9 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
