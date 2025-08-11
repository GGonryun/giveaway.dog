"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SweepstakesExportProps {
  sweepstakesId: string;
}

export function SweepstakesExport({ sweepstakesId }: SweepstakesExportProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Data</CardTitle>
        <CardDescription>
          Export entries and analytics data for this sweepstakes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p>Export functionality will be implemented here</p>
          <p className="text-xs mt-2">Sweepstakes ID: {sweepstakesId}</p>
        </div>
      </CardContent>
    </Card>
  );
}