"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Eye, Filter } from "lucide-react";
import { useState } from "react";

interface BotDetectionData {
  reason: string;
  count: number;
  percentage: number;
  severity: 'low' | 'medium' | 'high';
}

interface SweepstakesBotPieProps {
  data: BotDetectionData[];
}

const COLORS = {
  high: '#ef4444',     // red-500
  medium: '#f59e0b',   // amber-500  
  low: '#10b981'       // emerald-500
};

const chartConfig = {
  count: {
    label: "Flagged Entries"
  }
};

export function SweepstakesBotPie({ data }: SweepstakesBotPieProps) {
  const [selectedSlice, setSelectedSlice] = useState<string | null>(null);
  
  const totalFlagged = data.reduce((sum, item) => sum + item.count, 0);
  const highRiskCount = data.filter(item => item.severity === 'high').reduce((sum, item) => sum + item.count, 0);
  const highRiskPercentage = totalFlagged > 0 ? (highRiskCount / totalFlagged) * 100 : 0;

  const getSeverityBadge = (severity: BotDetectionData['severity']) => {
    const variants = {
      high: { variant: 'destructive' as const, label: 'High Risk' },
      medium: { variant: 'secondary' as const, label: 'Medium Risk' },
      low: { variant: 'default' as const, label: 'Low Risk' }
    };
    
    const config = variants[severity];
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  const handleSliceClick = (entry: any, index: number) => {
    const reason = data[index].reason;
    setSelectedSlice(selectedSlice === reason ? null : reason);
  };

  // Custom label function for pie chart
  const renderCustomizedLabel = (entry: any) => {
    if (entry.percentage < 5) return ''; // Don't show label for small slices
    return `${entry.percentage.toFixed(0)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Bot Detection</span>
          {totalFlagged > 0 && (
            <Badge variant="destructive">{totalFlagged}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Flagged entries by detection reason
        </CardDescription>
        
        {/* Key Metrics */}
        <div className="flex items-center space-x-4 pt-2 text-sm">
          <div>
            <span className="text-muted-foreground">High risk:</span>
            <Badge variant="destructive" className="ml-1">
              {highRiskPercentage.toFixed(1)}%
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Total flagged:</span>
            <span className="font-medium ml-1">{totalFlagged.toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-6">
        {totalFlagged === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-8 w-8 mx-auto mb-2 opacity-50 text-green-500" />
            <p className="text-green-600 font-medium">No suspicious entries detected</p>
            <p className="text-xs">All entries passed security checks</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pie Chart */}
            <div className="overflow-hidden">
              <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      onClick={handleSliceClick}
                      className="cursor-pointer"
                    >
                      {data.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[entry.severity]}
                          stroke={selectedSlice === entry.reason ? "#000" : "none"}
                          strokeWidth={selectedSlice === entry.reason ? 2 : 0}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border rounded-lg p-2 shadow-md">
                              <div className="font-medium">{data.reason}</div>
                              <div className="text-sm text-muted-foreground">
                                {data.count} entries ({data.percentage.toFixed(1)}%)
                              </div>
                              <div className="mt-1">
                                {getSeverityBadge(data.severity)}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Detailed Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Detection Reasons</h4>
                <Button variant="outline" size="sm">
                  <Filter className="h-3 w-3 mr-1" />
                  Filter
                </Button>
              </div>
              
              <div className="space-y-2">
                {data.map((item) => (
                  <div 
                    key={item.reason} 
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedSlice === item.reason 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedSlice(selectedSlice === item.reason ? null : item.reason)}
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[item.severity] }}
                      />
                      <div>
                        <div className="font-medium text-sm">{item.reason}</div>
                        <div className="flex items-center space-x-2">
                          {getSeverityBadge(item.severity)}
                          <span className="text-xs text-muted-foreground">
                            {item.percentage.toFixed(1)}% of flags
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="font-medium">{item.count}</div>
                        <div className="text-xs text-muted-foreground">entries</div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Slice Details */}
            {selectedSlice && (
              <div className="mt-4 pt-4 border-t">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="font-medium text-blue-800">{selectedSlice}</h5>
                      <p className="text-sm text-blue-600 mt-1">
                        Click "View Entries" to see detailed information about flagged entries for this reason.
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3 mr-1" />
                      View Entries
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Eye className="h-3 w-3 mr-1" />
                Review All
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <AlertTriangle className="h-3 w-3 mr-1" />
                High Risk Only
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}