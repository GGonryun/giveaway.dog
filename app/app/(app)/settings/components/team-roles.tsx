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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team & Roles</h1>
        <p className="text-muted-foreground">
          Manage team members and their permissions
        </p>
      </div>

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
          <p className="text-muted-foreground">
            Team management coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
