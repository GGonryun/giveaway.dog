import { Suspense } from 'react';
import { Outline } from '../../outline';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  Clock,
  Shield,
  Zap,
  Target
} from 'lucide-react';
import { UsersTable } from './components/users-table';
import { Skeleton } from '@/components/ui/skeleton';
import getUserAnalytics from '@/actions/users/get-user-analytics';

// Wrapper component to handle Suspense for useSearchParams
const UsersTableWrapper = () => {
  return <UsersTable />;
};

// Loading skeleton for KPI cards
const UsersKPISkeleton = () => {
  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-3" />
          </CardHeader>
          <CardContent className="pt-0">
            <Skeleton className="h-6 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Server component for user count badge
async function UserCountBadge() {
  const kpiData = await getUserAnalytics();
  return (
    <div className="flex items-center space-x-2">
      <Badge variant="secondary" className="text-xs">
        {kpiData.totalUsers.toLocaleString()} total users
      </Badge>
    </div>
  );
}

// Server component for KPI Cards
async function UsersKPISection() {
  const kpiData = await getUserAnalytics();

  const formatChange = (change: number) => (
    <span
      className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}
    >
      {change >= 0 ? '+' : ''}
      {change.toFixed(1)}%
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
          <div className="text-lg font-bold">
            {kpiData.totalUsers.toLocaleString()}
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {formatChange(kpiData.totalUsersChange)}
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
          <div className="text-lg font-bold">
            {kpiData.activeUsers.toLocaleString()}
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {formatChange(kpiData.activeUsersChange)}
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
          <div className="text-lg font-bold">
            {kpiData.qualityScore.toFixed(1)}
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {formatChange(kpiData.qualityScoreChange)}
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
          <div className="text-lg font-bold">
            {kpiData.flaggedUsers.toLocaleString()}
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {formatChange(kpiData.flaggedUsersChange)}
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
          <div className="text-lg font-bold">
            {kpiData.newUsers30d.toLocaleString()}
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {formatChange(kpiData.newUsers30dChange)}
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
          <div className="text-lg font-bold">
            {kpiData.avgEngagement.toFixed(1)}%
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {formatChange(kpiData.avgEngagementChange)}
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
          <div className="text-lg font-bold">
            {kpiData.conversionRate.toFixed(1)}%
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {formatChange(kpiData.conversionRateChange)}
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
          <div className="text-lg font-bold">
            {kpiData.crmSyncRate.toFixed(1)}%
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {formatChange(kpiData.crmSyncRateChange)}
            <span className="hidden sm:inline">from last month</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function UsersPage() {
  return (
    <Outline title="Users" container={true}>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Users Management
            </h1>
            <p className="text-muted-foreground">
              Manage and analyze your user base with comprehensive tools and
              insights.
            </p>
          </div>
          <Suspense fallback={<Skeleton className="h-5 w-24" />}>
            <UserCountBadge />
          </Suspense>
        </div>

        {/* KPI Cards */}
        <Suspense fallback={<UsersKPISkeleton />}>
          <UsersKPISection />
        </Suspense>

        {/* Main Users Table */}
        <Suspense fallback={<div>Loading users table...</div>}>
          <UsersTableWrapper />
        </Suspense>
      </div>
    </Outline>
  );
}
