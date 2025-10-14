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

        {tab === 'risk' && (
          <TabsContent value="risk" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Overall Risk Score
                    </span>
                    <Badge
                      variant={
                        user.riskScore < 30
                          ? 'default'
                          : user.riskScore < 60
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {user.riskScore < 30
                        ? 'Low Risk'
                        : user.riskScore < 60
                          ? 'Medium Risk'
                          : 'High Risk'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Risk Score</span>
                      <span>{user.riskScore}/100</span>
                    </div>
                    <Progress value={user.riskScore} className="h-3" />
                  </div>

                  {user.flagged ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm font-medium text-red-800 mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>User Flagged</span>
                      </div>
                      <div className="text-sm text-red-700">
                        {user.flaggedReasons.length > 0 ? (
                          <ul className="list-disc list-inside space-y-1">
                            {user.flaggedReasons.map((reason, index) => (
                              <li key={index}>{reason}</li>
                            ))}
                          </ul>
                        ) : (
                          'No specific reasons provided.'
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm font-medium text-green-800">
                        <Shield className="h-4 w-4" />
                        <span>User in Good Standing</span>
                      </div>
                      <div className="text-sm text-green-700 mt-1">
                        No risk factors detected.
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quality Score Breakdown</CardTitle>
                  <CardDescription>
                    Detailed analysis of quality factors
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Quality Score</span>
                      <span className="font-medium">
                        {user.qualityScore}/100
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={user.qualityScore} className="h-2" />
                      <div
                        className={`absolute top-0 left-0 h-2 rounded-full transition-all ${
                          user.qualityScore >= 80
                            ? 'bg-green-500'
                            : user.qualityScore >= 60
                              ? 'bg-yellow-500'
                              : user.qualityScore >= 40
                                ? 'bg-orange-500'
                                : 'bg-red-500'
                        }`}
                        style={{ width: `${user.qualityScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t">
                    <div className="text-xs text-muted-foreground font-medium">
                      Signal Breakdown
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">Email Verification</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress
                            value={
                              user.qualityBreakdown.emailVerified ? 100 : 0
                            }
                            className="w-16 h-1.5"
                          />
                          <span className="text-xs w-8 text-right">
                            {user.qualityBreakdown.emailVerified ? 25 : 0}/25
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">Email Quality</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress
                            value={
                              user.qualityBreakdown.disposableEmail ? 0 : 100
                            }
                            className="w-16 h-1.5"
                          />
                          <span className="text-xs w-8 text-right">
                            {user.qualityBreakdown.disposableEmail ? 0 : 20}/20
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Smartphone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">Device Trust</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress
                            value={
                              user.qualityBreakdown.deviceFingerprint ? 100 : 50
                            }
                            className="w-16 h-1.5"
                          />
                          <span className="text-xs w-8 text-right">
                            {user.qualityBreakdown.deviceFingerprint ? 20 : 10}
                            /20
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">Engagement</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress
                            value={user.qualityBreakdown.engagement}
                            className="w-16 h-1.5"
                          />
                          <span className="text-xs w-8 text-right">
                            {Math.round(user.qualityBreakdown.engagement / 4)}
                            /25
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">Account Age</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress
                            value={Math.min(
                              (user.qualityBreakdown.accountAge || 0) * 10,
                              100
                            )}
                            className="w-16 h-1.5"
                          />
                          <span className="text-xs w-8 text-right">
                            {Math.min(
                              Math.round(
                                (user.qualityBreakdown.accountAge || 0) * 0.2
                              ),
                              10
                            )}
                            /10
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quality Indicators</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Verified</span>
                    {user.qualityBreakdown.emailVerified ? (
                      <Badge variant="default">✓</Badge>
                    ) : (
                      <Badge variant="secondary">✗</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Phone Verified</span>
                    {user.qualityBreakdown.phoneVerified ? (
                      <Badge variant="default">✓</Badge>
                    ) : (
                      <Badge variant="secondary">✗</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Social Verification</span>
                    {user.qualityBreakdown.socialVerification ? (
                      <Badge variant="default">✓</Badge>
                    ) : (
                      <Badge variant="secondary">✗</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Disposable Email</span>
                    {user.qualityBreakdown.disposableEmail ? (
                      <Badge variant="destructive">Yes</Badge>
                    ) : (
                      <Badge variant="default">No</Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">IP Reputation</span>
                    <Badge
                      variant={
                        user.qualityBreakdown.ipReputation === 'good'
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {user.qualityBreakdown.ipReputation}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Account Age</span>
                    <span className="text-sm">
                      {user.qualityBreakdown.accountAge} days
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </div>
    </div>
  );
};
