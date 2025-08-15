import { Suspense } from 'react';
import { Outline } from '../../outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, AlertTriangle, TrendingUp, Clock, Shield, Zap, Target } from 'lucide-react';
import { UsersTable } from './components/users-table';

// Wrapper component to handle Suspense for useSearchParams
const UsersTableWrapper = () => {
  return <UsersTable />;
};

// Mock KPI data - in real app this would come from database
const mockKPIs = {
  totalUsers: 127459,
  totalUsersChange: 12.5,
  activeUsers: 89234,
  activeUsersChange: 8.3,
  qualityScore: 92.4,
  qualityScoreChange: 2.1,
  flaggedUsers: 1247,
  flaggedUsersChange: -15.2,
  newUsers30d: 23456,
  newUsers30dChange: 18.7,
  avgEngagement: 67.8,
  avgEngagementChange: 5.4,
  conversionRate: 15.2,
  conversionRateChange: 3.8,
  crmSyncRate: 98.5,
  crmSyncRateChange: 1.2
};

const UsersKPICards = () => {
  const formatChange = (change: number) => (
    <span className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
      {change >= 0 ? '+' : ''}{change.toFixed(1)}%
    </span>
  );

  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium">Total Users</CardTitle>
          <Users className="h-3 w-3 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-lg font-bold">{mockKPIs.totalUsers.toLocaleString()}</div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {formatChange(mockKPIs.totalUsersChange)}
            <span className="hidden sm:inline">from last month</span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium">Active Users</CardTitle>
          <UserCheck className="h-3 w-3 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-lg font-bold">{mockKPIs.activeUsers.toLocaleString()}</div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {formatChange(mockKPIs.activeUsersChange)}
            <span className="hidden sm:inline">from last month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium">Quality Score</CardTitle>
          <Shield className="h-3 w-3 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-lg font-bold">{mockKPIs.qualityScore.toFixed(1)}</div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {formatChange(mockKPIs.qualityScoreChange)}
            <span className="hidden sm:inline">from last month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium">Flagged Users</CardTitle>
          <AlertTriangle className="h-3 w-3 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-lg font-bold">{mockKPIs.flaggedUsers.toLocaleString()}</div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {formatChange(mockKPIs.flaggedUsersChange)}
            <span className="hidden sm:inline">from last month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium">New Users (30d)</CardTitle>
          <TrendingUp className="h-3 w-3 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-lg font-bold">{mockKPIs.newUsers30d.toLocaleString()}</div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {formatChange(mockKPIs.newUsers30dChange)}
            <span className="hidden sm:inline">from last month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium">Avg. Engagement</CardTitle>
          <Zap className="h-3 w-3 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-lg font-bold">{mockKPIs.avgEngagement.toFixed(1)}%</div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {formatChange(mockKPIs.avgEngagementChange)}
            <span className="hidden sm:inline">from last month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium">Conversion Rate</CardTitle>
          <Target className="h-3 w-3 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-lg font-bold">{mockKPIs.conversionRate.toFixed(1)}%</div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {formatChange(mockKPIs.conversionRateChange)}
            <span className="hidden sm:inline">from last month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
          <CardTitle className="text-xs font-medium">CRM Sync Rate</CardTitle>
          <Clock className="h-3 w-3 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-lg font-bold">{mockKPIs.crmSyncRate.toFixed(1)}%</div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {formatChange(mockKPIs.crmSyncRateChange)}
            <span className="hidden sm:inline">from last month</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default async function UsersPage() {
  return (
    <Outline title="Users" container={true}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Users Management</h1>
            <p className="text-muted-foreground">
              Manage and analyze your user base with comprehensive tools and insights.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              127,459 total users
            </Badge>
          </div>
        </div>

        {/* KPI Cards */}
        <UsersKPICards />

        {/* Main Users Table */}
        <Suspense fallback={<div>Loading users table...</div>}>
          <UsersTableWrapper />
        </Suspense>
      </div>
    </Outline>
  );
}
