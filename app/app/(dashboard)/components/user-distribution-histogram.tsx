"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface DistributionData {
  entriesRange: string;
  userCount: number;
  percentage: number;
  suspicious: boolean;
}

interface UserDistributionHistogramProps {
  data: DistributionData[];
}

const chartConfig = {
  userCount: {
    label: "Users",
    color: "var(--color-chart-1)"
  }
};

export function UserDistributionHistogram({ data }: UserDistributionHistogramProps) {
  const suspiciousUsers = data.filter(d => d.suspicious).reduce((sum, d) => sum + d.userCount, 0);
  const totalUsers = data.reduce((sum, d) => sum + d.userCount, 0);
  const suspiciousPercentage = (suspiciousUsers / totalUsers) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entries per User Distribution</CardTitle>
        <CardDescription>
          Identify potential sock-puppet accounts and multiple entries
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="space-y-4">
          {/* Histogram Chart */}
          <div className="overflow-hidden">
            <ChartContainer config={chartConfig} className="min-h-[200px] sm:min-h-[300px] w-full">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, bottom: 30, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="entriesRange"
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => {
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                    return value.toString();
                  }}
                />
                <ChartTooltip content={ChartTooltipContent} />
                <Bar
                  dataKey="userCount"
                  fill="var(--color-chart-1)"
                  name="Users"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </div>

          {/* Suspicious Activity Alert */}
          {suspiciousPercentage > 5 && (
            <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="font-medium text-yellow-800">
                  Suspicious Activity Detected
                </div>
                <div className="text-sm text-yellow-600">
                  {suspiciousUsers.toLocaleString()} users ({suspiciousPercentage.toFixed(1)}%) have unusually high entry counts
                </div>
              </div>
            </div>
          )}

          {/* Distribution Breakdown */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Entry Pattern Analysis</div>
            <div className="grid gap-2">
              {data.map((item, index) => (
                <div 
                  key={item.entriesRange} 
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    item.suspicious ? 'bg-red-50 border border-red-200' : 'bg-muted'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="font-medium">{item.entriesRange}</div>
                    {item.suspicious && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Suspicious
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-medium">{item.userCount.toLocaleString()} users</span>
                    <span className="text-muted-foreground">({item.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t text-sm">
            <div>
              <div className="text-muted-foreground">Normal Users</div>
              <div className="font-medium text-green-600">
                {(totalUsers - suspiciousUsers).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Flagged Users</div>
              <div className="font-medium text-red-600">
                {suspiciousUsers.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Risk Level</div>
              <div className={`font-medium ${
                suspiciousPercentage > 10 ? 'text-red-600' : 
                suspiciousPercentage > 5 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {suspiciousPercentage > 10 ? 'High' : 
                 suspiciousPercentage > 5 ? 'Medium' : 'Low'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Avg Entries/User</div>
              <div className="font-medium">2.3</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}