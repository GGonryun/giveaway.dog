'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  MapPin,
  Calendar,
  Activity,
  AlertTriangle,
  Shield,
  ExternalLink,
  UserCheck,
  UserX,
  Tag,
  Download,
  Clock,
  TrendingUp,
  Globe,
  Trophy,
  Target,
  BarChart3,
  Smartphone,
  Monitor,
  DollarSign,
  Users
} from 'lucide-react';

import { UserDetailsTabSchema } from '@/schemas/user';
import { FeatureInDevelopmentDialog } from '@/components/users/feature-in-development-dialog';
import { StatusExplanationDialog } from '@/components/users/status-explanation-dialog';

interface UserDetailViewProps {
  userId: string;
  tab: UserDetailsTabSchema;
}

// Enhanced mock user data with additional analytics
const getUserDetailExtended = (userId: string) => ({
  id: userId,
  name: `User ${userId.replace('user_', '')}`,
  email: `user${userId.replace('user_', '')}@example.com`,
  avatar: null,
  status: 'active' as const,
  qualityScore: 78,
  engagement: 65,
  joinedAt: '2024-03-15T10:30:00Z',
  lastActive: '2025-01-13T14:22:00Z',
  location: 'San Francisco, CA',
  timezone: 'PST',
  source: 'Instagram',
  totalEntries: 47,
  totalWins: 3,
  lifetimeValue: 2450,
  tags: ['High Value', 'Frequent Participant', 'Social Influencer'],

  // Enhanced analytics
  analyticsData: {
    totalRafflesEntered: 23,
    completedEntries: 41,
    partialEntries: 6,
    avgCompletionRate: 87.2,
    referralCount: 12,
    socialShares: 28,
    avgSessionDuration: 425,
    bounceRate: 0.18,
    conversionRate: 0.23,
    totalSpent: 0,
    revenueGenerated: 2450,
    winRate: 0.064
  },

  // Risk signals
  flagged: false,
  flaggedReasons: [],
  riskScore: 22,

  // All entries with detailed info
  allEntries: [
    {
      id: 'entry_1',
      sweepstakesId: 'sweep_1',
      sweepstakesTitle: 'iPhone 15 Pro Giveaway',
      enteredAt: '2025-01-13T09:15:00Z',
      completedAt: '2025-01-13T09:17:00Z',
      source: 'Instagram',
      status: 'valid',
      prize: 'iPhone 15 Pro (256GB)',
      prizeValue: 1199,
      completionRate: 100,
      actionsCompleted: ['follow', 'like', 'comment', 'share'],
      referrals: 2
    },
    {
      id: 'entry_2',
      sweepstakesId: 'sweep_2',
      sweepstakesTitle: 'Gaming Setup Contest',
      enteredAt: '2025-01-10T16:45:00Z',
      completedAt: '2025-01-10T16:52:00Z',
      source: 'Direct',
      status: 'valid',
      prize: 'Gaming PC + Peripherals',
      prizeValue: 2499,
      completionRate: 90,
      actionsCompleted: ['email', 'follow', 'subscribe'],
      referrals: 0
    },
    {
      id: 'entry_3',
      sweepstakesId: 'sweep_3',
      sweepstakesTitle: 'Travel Voucher Sweeps',
      enteredAt: '2025-01-08T11:20:00Z',
      completedAt: null,
      source: 'Facebook',
      status: 'partial',
      prize: '$2000 Travel Voucher',
      prizeValue: 2000,
      completionRate: 60,
      actionsCompleted: ['email', 'follow'],
      referrals: 1
    },
    {
      id: 'entry_4',
      sweepstakesId: 'sweep_4',
      sweepstakesTitle: 'Smart Home Bundle',
      enteredAt: '2025-01-05T14:30:00Z',
      completedAt: '2025-01-05T14:35:00Z',
      source: 'Twitter',
      status: 'winner',
      prize: 'Smart Home Starter Kit',
      prizeValue: 899,
      completionRate: 100,
      actionsCompleted: ['follow', 'retweet', 'tag_friends'],
      referrals: 3
    }
  ],

  // Wins history
  wins: [
    {
      id: 'win_1',
      sweepstakesTitle: 'Smart Home Bundle',
      wonAt: '2025-01-06T10:00:00Z',
      prize: 'Smart Home Starter Kit',
      prizeValue: 899,
      claimed: true,
      claimedAt: '2025-01-07T15:30:00Z'
    },
    {
      id: 'win_2',
      sweepstakesTitle: 'Coffee Bundle Giveaway',
      wonAt: '2024-12-22T08:15:00Z',
      prize: 'Premium Coffee Collection',
      prizeValue: 249,
      claimed: true,
      claimedAt: '2024-12-23T12:00:00Z'
    },
    {
      id: 'win_3',
      sweepstakesTitle: 'Holiday Gift Card',
      wonAt: '2024-11-28T16:45:00Z',
      prize: '$100 Amazon Gift Card',
      prizeValue: 100,
      claimed: false,
      claimedAt: null
    }
  ],

  // Device/browser info
  devices: [
    {
      id: 'dev_1',
      type: 'Mobile',
      os: 'iOS 17.2',
      browser: 'Safari',
      lastUsed: '2025-01-13T14:22:00Z',
      sessions: 34,
      avgSessionTime: 280
    },
    {
      id: 'dev_2',
      type: 'Desktop',
      os: 'macOS',
      browser: 'Chrome',
      lastUsed: '2025-01-12T10:15:00Z',
      sessions: 12,
      avgSessionTime: 620
    },
    {
      id: 'dev_3',
      type: 'Mobile',
      os: 'Android 13',
      browser: 'Chrome Mobile',
      lastUsed: '2025-01-09T19:30:00Z',
      sessions: 3,
      avgSessionTime: 150
    }
  ],

  // Social engagement
  socialEngagement: {
    platform: 'Instagram',
    followers: 2340,
    following: 890,
    posts: 156,
    avgLikes: 45,
    avgComments: 8,
    hashtagsUsed: ['#giveaway', '#contest', '#win', '#free', '#sweepstakes'],
    influenceScore: 72,
    brandMentions: 23
  },

  // Quality score breakdown
  qualityBreakdown: {
    emailVerified: true,
    disposableEmail: false,
    deviceFingerprint: 'fp_abc123xyz',
    engagement: 65,
    accountAge: 304,
    multipleEntries: false,
    ipReputation: 'good' as const,
    socialVerification: true,
    phoneVerified: true,
    addressVerified: false,
    socialConnections: 3
  }
});

export const UserDetailView = ({ userId, tab }: UserDetailViewProps) => {
  const user = useMemo(() => getUserDetailExtended(userId), [userId]);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showFeatureDialog, setShowFeatureDialog] = useState(false);
  const [featureName, setFeatureName] = useState('');

  const handleFeatureClick = (name: string) => {
    setFeatureName(name);
    setShowFeatureDialog(true);
  };

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

  const getStatusBadge = (status: string, isUserStatus = false) => {
    const variants = {
      active: {
        variant: 'default' as const,
        label: 'Active',
        color: 'text-green-600'
      },
      flagged: {
        variant: 'destructive' as const,
        label: 'Flagged',
        color: 'text-red-600'
      },
      blocked: {
        variant: 'secondary' as const,
        label: 'Blocked',
        color: 'text-gray-600'
      },
      trusted: {
        variant: 'default' as const,
        label: 'Trusted',
        color: 'text-blue-600'
      },
      winner: {
        variant: 'default' as const,
        label: 'Winner',
        color: 'text-yellow-600'
      },
      valid: {
        variant: 'outline' as const,
        label: 'Valid',
        color: 'text-green-600'
      },
      partial: {
        variant: 'secondary' as const,
        label: 'Partial',
        color: 'text-yellow-600'
      }
    };

    const config = variants[status as keyof typeof variants] || variants.active;

    if (isUserStatus && (status === 'active' || status === 'blocked')) {
      return (
        <Badge
          variant={config.variant}
          className={`${config.color} cursor-pointer hover:opacity-80 transition-opacity`}
          onClick={(e) => {
            e.stopPropagation();
            setShowStatusDialog(true);
          }}
        >
          {config.label}
        </Badge>
      );
    }

    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Main Content */}
      <div className="space-y-4">
        {tab === 'overview' && (
          <TabsContent value="overview" className="space-y-4">
            {/* Key Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Entries
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.totalEntries}</div>
                  <p className="text-xs text-muted-foreground">
                    {user.analyticsData.avgCompletionRate.toFixed(1)}%
                    completion rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Wins</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {user.totalWins}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(user.analyticsData.winRate * 100).toFixed(1)}% win rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Lifetime Value
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(user.lifetimeValue)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Generated revenue
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Quality Score
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.qualityScore}</div>
                  <p className="text-xs text-muted-foreground">
                    Excellent quality
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* User Header */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback className="text-2xl">
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 space-y-2">
                    <h2 className="text-2xl font-bold">{user.name}</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {user.email}
                      </span>
                      {user.qualityBreakdown.emailVerified && (
                        <Badge variant="outline" className="text-green-600">
                          Verified
                        </Badge>
                      )}
                      {getStatusBadge(user.status, true)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Twitter: @username</Badge>
                      <Badge variant="outline">Google: email@gmail.com</Badge>
                    </div>
                  </div>
                </div>

                {/* Grid Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{user.location}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Joined {formatDate(user.joinedAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span>Last active {formatDate(user.lastActive)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>Source: {user.source}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Timezone: {user.timezone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{user.analyticsData.referralCount} referrals</span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {user.tags.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Tags</span>
                    <div className="flex flex-wrap gap-2">
                      {user.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Analytics Metrics */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Avg. Session Duration</span>
                      <span>
                        {Math.floor(user.analyticsData.avgSessionDuration / 60)}
                        m {user.analyticsData.avgSessionDuration % 60}s
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Bounce Rate</span>
                      <span>
                        {(user.analyticsData.bounceRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Conversion Rate</span>
                      <span>
                        {(user.analyticsData.conversionRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Social Shares</span>
                      <span>{user.analyticsData.socialShares}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Completed Entries</span>
                      <span>
                        {user.analyticsData.completedEntries}/
                        {user.analyticsData.completedEntries +
                          user.analyticsData.partialEntries}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Win Rate</span>
                      <span>
                        {(user.analyticsData.winRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Revenue Generated</span>
                      <span>
                        {formatCurrency(user.analyticsData.revenueGenerated)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Referrals Made</span>
                      <span>{user.analyticsData.referralCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Bar */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Mark as Trusted</span>
                      <span className="sm:hidden">Trusted</span>
                    </Button>
                    <Button variant="destructive" size="sm">
                      <UserX className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Block User</span>
                      <span className="sm:hidden">Block</span>
                    </Button>
                    <Button variant="secondary" size="sm">
                      <Tag className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Add Tags</span>
                      <span className="sm:hidden">Tags</span>
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleFeatureClick('Export Data')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Export Data</span>
                      <span className="sm:hidden">Export</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleFeatureClick('View in CRM')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">View in CRM</span>
                      <span className="sm:hidden">CRM</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

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
                        <TableCell>{getStatusBadge(entry.status)}</TableCell>
                        <TableCell>{entry.referrals}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {tab === 'devices' && (
          <TabsContent value="devices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Device & Browser Information</CardTitle>
                <CardDescription>
                  Devices used to access the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user.devices.map((device) => (
                    <div
                      key={device.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {device.type === 'Mobile' ? (
                          <Smartphone className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Monitor className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <div className="font-medium">{device.type}</div>
                          <div className="text-sm text-muted-foreground">
                            {device.os} • {device.browser}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {device.sessions} sessions
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Avg: {Math.floor(device.avgSessionTime / 60)}m{' '}
                          {device.avgSessionTime % 60}s
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last: {formatDate(device.lastUsed)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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

      {/* Status Explanation Dialog */}
      <StatusExplanationDialog
        open={showStatusDialog}
        onClose={() => setShowStatusDialog(false)}
        status={user.status as 'active' | 'blocked'}
      />

      {/* Feature In Development Dialog */}
      <FeatureInDevelopmentDialog
        open={showFeatureDialog}
        onClose={() => setShowFeatureDialog(false)}
        featureName={featureName}
      />
    </div>
  );
};
