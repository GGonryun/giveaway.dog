'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Building2, PaintbrushIcon } from 'lucide-react';

export function OrgProfile() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Basic Information</span>
          </CardTitle>
          <CardDescription>
            Core details about your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Basic organization settings coming soon...
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PaintbrushIcon className="h-5 w-5" />
            <span>Branding & Localization</span>
          </CardTitle>
          <CardDescription>
            Customize appearance and regional settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Branding and localization settings coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
