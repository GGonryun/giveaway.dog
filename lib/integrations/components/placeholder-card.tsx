'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CircleQuestionMark, MessageSquare } from 'lucide-react';

export function PlaceholderCard() {
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <CircleQuestionMark className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-base">More Coming Soon</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Additional integrations
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 h-full flex flex-col justify-between">
        <p className="text-xs text-muted-foreground">
          We're working on bringing you more integration options.
        </p>
        <Button variant="outline" size="sm" className="w-full" asChild>
          <a href="/support">
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            Suggest Integration
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
