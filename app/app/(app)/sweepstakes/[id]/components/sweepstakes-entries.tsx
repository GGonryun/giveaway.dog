"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SweepstakesEntriesProps {
  sweepstakesId: string;
}

export function SweepstakesEntries({ sweepstakesId }: SweepstakesEntriesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-time Entries</CardTitle>
        <CardDescription>
          Live feed of entries for this sweepstakes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p>Real-time entries feed will be implemented here</p>
          <p className="text-xs mt-2">Sweepstakes ID: {sweepstakesId}</p>
        </div>
      </CardContent>
    </Card>
  );
}