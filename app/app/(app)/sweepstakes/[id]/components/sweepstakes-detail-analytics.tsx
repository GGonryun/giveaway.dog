"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SweepstakesDetailAnalyticsProps {
  sweepstakesId: string;
  data: any;
}

export function SweepstakesDetailAnalytics({ sweepstakesId, data }: SweepstakesDetailAnalyticsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Analytics</CardTitle>
        <CardDescription>
          Comprehensive analytics for this specific sweepstakes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p>Detailed analytics component will be implemented here</p>
          <p className="text-xs mt-2">Sweepstakes ID: {sweepstakesId}</p>
        </div>
      </CardContent>
    </Card>
  );
}