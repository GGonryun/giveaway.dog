'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export function Billing() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5" />
          <span>Billing Management</span>
        </CardTitle>
        <CardDescription>
          Subscription plans and payment processing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Billing dashboard coming soon...
        </p>
      </CardContent>
    </Card>
  );
}
