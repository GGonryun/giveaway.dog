"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeatmapData } from "@/schemas";

interface EntryVelocityHeatmapProps {
  data: HeatmapData[];
}

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = Array.from({ length: 24 }, (_, i) => i);

export function EntryVelocityHeatmap({ data }: EntryVelocityHeatmapProps) {
  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'bg-muted';
    if (intensity < 25) return 'bg-blue-200';
    if (intensity < 50) return 'bg-blue-400';
    if (intensity < 75) return 'bg-blue-600';
    return 'bg-blue-800';
  };

  const getCellData = (day: string, hour: number) => {
    return data.find(d => d.day === day && d.hour === hour) || { hour, day, entries: 0, intensity: 0 };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entry Velocity Heatmap</CardTitle>
        <CardDescription>
          Optimal times for promotions - entries by hour and day
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Less activity</span>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-muted rounded-sm"></div>
              <div className="w-3 h-3 bg-blue-200 rounded-sm"></div>
              <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
              <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
              <div className="w-3 h-3 bg-blue-800 rounded-sm"></div>
            </div>
            <span>More activity</span>
          </div>
          
          {/* Heatmap Grid */}
          <div className="block sm:hidden">
            {/* Mobile: Vertical layout by day */}
            <div className="space-y-4">
              {days.map(day => {
                const dayData = hours.map(hour => getCellData(day, hour));
                const dayTotal = dayData.reduce((sum, cell) => sum + cell.entries, 0);
                const avgIntensity = dayData.reduce((sum, cell) => sum + cell.intensity, 0) / dayData.length;
                
                return (
                  <div key={day} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">{day}</div>
                      <div className="text-xs text-muted-foreground">
                        {dayTotal} entries
                      </div>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {[0, 4, 8, 12, 16, 20].map(startHour => {
                        const blockData = hours.slice(startHour, startHour + 4);
                        const blockIntensity = blockData.reduce((sum, hour) => {
                          const cell = getCellData(day, hour);
                          return sum + cell.intensity;
                        }, 0) / blockData.length;
                        const blockEntries = blockData.reduce((sum, hour) => {
                          const cell = getCellData(day, hour);
                          return sum + cell.entries;
                        }, 0);
                        
                        return (
                          <div
                            key={startHour}
                            className={`aspect-square rounded-sm cursor-pointer transition-all hover:scale-105 ${getIntensityColor(blockIntensity)} flex items-center justify-center`}
                            title={`${day} ${startHour}:00-${startHour+3}:59 - ${blockEntries} entries`}
                          >
                            <span className="text-xs font-medium text-white">
                              {startHour === 0 ? '12a' : startHour < 12 ? `${startHour}a` : startHour === 12 ? '12p' : `${startHour-12}p`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Desktop: Traditional horizontal heatmap */}
          <div className="hidden sm:block">
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Hour labels */}
                <div className="grid grid-cols-25 gap-1 mb-2">
                  <div className="text-xs font-medium"></div> {/* Empty corner */}
                  {hours.map(hour => (
                    <div key={hour} className="text-xs text-center text-muted-foreground">
                      {hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour-12}p`}
                    </div>
                  ))}
                </div>
                
                {/* Heatmap rows */}
                {days.map(day => (
                  <div key={day} className="grid grid-cols-25 gap-1 mb-1">
                    <div className="text-xs font-medium text-muted-foreground py-1">
                      {day}
                    </div>
                    {hours.map(hour => {
                      const cellData = getCellData(day, hour);
                      return (
                        <div
                          key={`${day}-${hour}`}
                          className={`aspect-square rounded-sm cursor-pointer transition-all hover:scale-110 hover:ring-2 hover:ring-blue-400 ${getIntensityColor(cellData.intensity)}`}
                          title={`${day} ${hour}:00 - ${cellData.entries} entries`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Peak times summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t text-sm">
            <div>
              <div className="text-muted-foreground">Peak Day</div>
              <div className="font-medium">Thursday</div>
            </div>
            <div>
              <div className="text-muted-foreground">Peak Hour</div>
              <div className="font-medium">8-9 PM</div>
            </div>
            <div>
              <div className="text-muted-foreground">Best Time</div>
              <div className="font-medium">Thu 8 PM</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}