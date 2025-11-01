'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Users } from 'lucide-react';

export function TeamRoles() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Team Management</span>
        </CardTitle>
        <CardDescription>
          Invite users and manage role-based permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Team management coming soon...</p>
      </CardContent>
    </Card>
  );
}
