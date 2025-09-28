'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { FileText } from 'lucide-react';

export function Legal() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Legal Templates</span>
        </CardTitle>
        <CardDescription>
          Customize legal documents for your giveaways
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Legal document editor coming soon...
        </p>
      </CardContent>
    </Card>
  );
}
