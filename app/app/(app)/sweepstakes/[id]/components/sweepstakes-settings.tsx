"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SweepstakesDetails {
  id: string;
  title: string;
  description: string;
  status: string;
}

interface SweepstakesSettingsProps {
  sweepstakes: SweepstakesDetails;
}

export function SweepstakesSettings({ sweepstakes }: SweepstakesSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>
          Configure settings for this sweepstakes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p>Settings configuration will be implemented here</p>
          <p className="text-xs mt-2">Title: {sweepstakes.title}</p>
        </div>
      </CardContent>
    </Card>
  );
}