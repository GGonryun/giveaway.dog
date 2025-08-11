"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer } from "@/components/ui/chart";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import {
  Eye,
  Play,
  Pause,
  Edit,
  Download,
  Share,
  Clock,
  Users,
  Target,
  Shield,
  Calendar,
  TrendingUp,
  TrendingDown,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface SweepstakesData {
  id: string;
  title: string;
  status: 'active' | 'ending-soon' | 'draft' | 'paused' | 'completed';
  entries: number;
  uniqueEntrants: number;
  conversionRate: number;
  botRate: number;
  timeLeft: string;
  createdAt: string;
  dailyTrend: number[];
  topSource: string;
}

interface SweepstakesListProps {
  sweepstakes: SweepstakesData[];
}

const chartConfig = {
  trend: {
    label: "Daily Entries",
    color: "var(--color-chart-1)"
  }
};

export function SweepstakesList({ sweepstakes }: SweepstakesListProps) {
  const getStatusBadge = (status: SweepstakesData['status']) => {
    const variants = {
      active: { variant: 'default' as const, label: 'Active' },
      'ending-soon': { variant: 'destructive' as const, label: 'Ending Soon' },
      draft: { variant: 'secondary' as const, label: 'Draft' },
      paused: { variant: 'outline' as const, label: 'Paused' },
      completed: { variant: 'secondary' as const, label: 'Completed' }
    };
    
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: SweepstakesData['status']) => {
    switch (status) {
      case 'active':
        return <Play className="h-3 w-3 text-green-500" />;
      case 'paused':
        return <Pause className="h-3 w-3 text-yellow-500" />;
      case 'ending-soon':
        return <Clock className="h-3 w-3 text-red-500" />;
      case 'draft':
        return <Edit className="h-3 w-3 text-gray-500" />;
      case 'completed':
        return <Calendar className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const getTrendDirection = (trend: number[]) => {
    if (trend.length < 2) return 'neutral';
    const first = trend[0];
    const last = trend[trend.length - 1];
    return last > first ? 'up' : last < first ? 'down' : 'neutral';
  };

  // Transform trend data for mini chart
  const getTrendData = (trend: number[]) => {
    return trend.map((value, index) => ({ day: index, value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Active Sweepstakes</span>
          <Badge variant="secondary">{sweepstakes.length}</Badge>
        </CardTitle>
        <CardDescription>
          Manage and monitor all your sweepstakes campaigns
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-6">
        <div className="space-y-4">
          {sweepstakes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No sweepstakes found</p>
              <Button asChild className="mt-2" size="sm">
                <Link href="/app/sweepstakes/create">Create Your First Sweepstakes</Link>
              </Button>
            </div>
          ) : (
            sweepstakes.map((item) => {
              const trendDirection = getTrendDirection(item.dailyTrend);
              const trendData = getTrendData(item.dailyTrend);
              
              return (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.status)}
                        <h4 className="font-medium line-clamp-2 text-sm">{item.title}</h4>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {item.timeLeft}
                        </span>
                        <span>•</span>
                        <span>Top: {item.topSource}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/app/sweepstakes/${item.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Export Entries
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-yellow-600">
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Mini Chart and KPIs */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Mini Trend Chart */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">7-Day Trend</span>
                        <div className="flex items-center space-x-1">
                          {trendDirection === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                          {trendDirection === 'down' && <TrendingDown className="h-3 w-3 text-red-500" />}
                          <span className={`text-xs font-medium ${
                            trendDirection === 'up' ? 'text-green-500' : 
                            trendDirection === 'down' ? 'text-red-500' : 'text-muted-foreground'
                          }`}>
                            {trendDirection === 'up' ? 'Rising' : 
                             trendDirection === 'down' ? 'Falling' : 'Stable'}
                          </span>
                        </div>
                      </div>
                      <div className="h-12 w-full">
                        <ChartContainer config={chartConfig} className="h-full w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                              <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="var(--color-chart-1)" 
                                strokeWidth={2}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                    </div>

                    {/* KPI Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span className="text-xs">Entries</span>
                        </div>
                        <div className="font-bold">{item.entries.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.uniqueEntrants.toLocaleString()} unique
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Target className="h-3 w-3" />
                          <span className="text-xs">Conversion</span>
                        </div>
                        <div className="font-bold">{item.conversionRate.toFixed(1)}%</div>
                        <div className={`text-xs ${
                          item.conversionRate > 8 ? 'text-green-600' : 
                          item.conversionRate > 5 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {item.conversionRate > 8 ? 'Excellent' : 
                           item.conversionRate > 5 ? 'Good' : 'Needs Work'}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Shield className="h-3 w-3" />
                          <span className="text-xs">Bot Rate</span>
                        </div>
                        <div className={`font-bold ${
                          item.botRate > 20 ? 'text-red-500' : 
                          item.botRate > 10 ? 'text-yellow-500' : 'text-green-500'
                        }`}>
                          {item.botRate.toFixed(1)}%
                        </div>
                        <div className={`text-xs ${
                          item.botRate > 20 ? 'text-red-600' : 
                          item.botRate > 10 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {item.botRate > 20 ? 'High Risk' : 
                           item.botRate > 10 ? 'Medium' : 'Low Risk'}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span className="text-xs">Status</span>
                        </div>
                        <div className="font-medium text-sm capitalize">
                          {item.status.replace('-', ' ')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.timeLeft}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* View All Button */}
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/app/sweepstakes/all">
              <Eye className="h-4 w-4 mr-2" />
              View All Sweepstakes
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}