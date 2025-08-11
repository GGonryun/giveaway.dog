"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SweepstakesDetails {
  id: string;
  title: string;
  landingPageUrl: string;
  shareUrl: string;
}

interface SweepstakesPromotionProps {
  sweepstakes: SweepstakesDetails;
}

export function SweepstakesPromotion({ sweepstakes }: SweepstakesPromotionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Promotion Tools</CardTitle>
        <CardDescription>
          Social sharing, UTM templates, and promotional materials
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p>Promotion tools will be implemented here</p>
          <p className="text-xs mt-2">Share URL: {sweepstakes.shareUrl}</p>
        </div>
      </CardContent>
    </Card>
  );
}