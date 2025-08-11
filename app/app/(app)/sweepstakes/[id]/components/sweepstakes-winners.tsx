"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SweepstakesWinnersProps {
  sweepstakesId: string;
}

export function SweepstakesWinners({ sweepstakesId }: SweepstakesWinnersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Winners</CardTitle>
        <CardDescription>
          Select and manage winners for this sweepstakes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p>Winner selection and management will be implemented here</p>
          <p className="text-xs mt-2">Sweepstakes ID: {sweepstakesId}</p>
        </div>
      </CardContent>
    </Card>
  );
}