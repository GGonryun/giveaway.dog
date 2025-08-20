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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and payment methods
        </p>
      </div>

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
    </div>
  );
}
