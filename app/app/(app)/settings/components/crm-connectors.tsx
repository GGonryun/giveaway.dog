'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

export function CRMConnectors() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CRM Connectors</h1>
        <p className="text-muted-foreground">
          Connect your CRM systems to sync leads and data
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5" />
            <span>CRM Integrations</span>
          </CardTitle>
          <CardDescription>
            Sync leads and customer data with your CRM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">CRM connectors coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}