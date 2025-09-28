'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Zap } from 'lucide-react';

export function Integrations() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5" />
          <span>Available Integrations</span>
        </CardTitle>
        <CardDescription>
          Connect with third-party services and automation platforms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Integrations coming soon...</p>
      </CardContent>
    </Card>
  );
}
