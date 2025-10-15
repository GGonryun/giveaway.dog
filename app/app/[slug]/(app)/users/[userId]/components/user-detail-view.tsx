'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Mail,
  AlertTriangle,
  Shield,
  Clock,
  TrendingUp,
  Smartphone
} from 'lucide-react';

import { UserDetailsTabSchema } from '@/schemas/user';
import React from 'react';
import { UserDetailExtended } from './data';

interface UserDetailViewProps {
  user: UserDetailExtended;
  tab: UserDetailsTabSchema;
}

export const UserDetailView = ({ user, tab }: UserDetailViewProps) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Main Content */}
      <div className="space-y-4">
        {tab === 'entries' && (
          <TabsContent value="entries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Entries ({user.allEntries.length})</CardTitle>
                <CardDescription>
                  Complete history of sweepstakes entries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sweepstakes</TableHead>
                      <TableHead>Prize</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Completion</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Referrals</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.allEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="font-medium">
                            {entry.sweepstakesTitle}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{entry.prize}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(entry.prizeValue)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(entry.enteredAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.source}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress
                              value={entry.completionRate}
                              className="w-16 h-2"
                            />
                            <span className="text-sm">
                              {entry.completionRate}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {/* <UserStatusBadge status={entry.status} /> */}
                        </TableCell>
                        <TableCell>{entry.referrals}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </div>
    </div>
  );
};
