"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LocationData } from "@/schemas";

interface GeolocationMapProps {
  data: LocationData[];
}

export function GeolocationMap({ data }: GeolocationMapProps) {
  const topCountries = data.slice(0, 10);
  const maxEntries = Math.max(...topCountries.map(d => d.entries));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entry Locations</CardTitle>
        <CardDescription>
          Geographic distribution of contest entries
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="space-y-4">
          {/* Top locations list */}
          <div className="space-y-3">
            {topCountries.map((location, index) => {
              const barWidth = (location.entries / maxEntries) * 100;
              
              return (
                <div key={`${location.country}-${location.state}`} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium w-6 text-muted-foreground">
                        #{index + 1}
                      </span>
                      <div className="flex items-center space-x-2">
                        {location.flag && (
                          <span className="text-lg">{location.flag}</span>
                        )}
                        <span className="font-medium">
                          {location.city ? `${location.city}, ` : ''}
                          {location.state ? `${location.state}, ` : ''}
                          {location.country}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{location.entries.toLocaleString()}</span>
                      <Badge variant="secondary" className="text-xs">
                        {location.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t text-sm">
            <div>
              <div className="text-muted-foreground">Top Country</div>
              <div className="font-medium flex items-center space-x-1">
                {topCountries[0]?.flag && <span>{topCountries[0].flag}</span>}
                <span>{topCountries[0]?.country}</span>
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Countries</div>
              <div className="font-medium">{new Set(data.map(d => d.country)).size}</div>
            </div>
            <div>
              <div className="text-muted-foreground">States/Regions</div>
              <div className="font-medium">{data.filter(d => d.state).length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Cities</div>
              <div className="font-medium">{data.filter(d => d.city).length}</div>
            </div>
          </div>

          {/* International vs Domestic */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Geographic Distribution</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <div className="font-medium">🇺🇸 Domestic</div>
                  <div className="text-muted-foreground">United States</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {data.filter(d => d.country === 'United States')
                      .reduce((sum, d) => sum + d.entries, 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {((data.filter(d => d.country === 'United States')
                      .reduce((sum, d) => sum + d.entries, 0) / 
                      data.reduce((sum, d) => sum + d.entries, 0)) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <div className="font-medium">🌍 International</div>
                  <div className="text-muted-foreground">Other countries</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {data.filter(d => d.country !== 'United States')
                      .reduce((sum, d) => sum + d.entries, 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {((data.filter(d => d.country !== 'United States')
                      .reduce((sum, d) => sum + d.entries, 0) / 
                      data.reduce((sum, d) => sum + d.entries, 0)) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}