"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  CalendarIcon, 
  Search, 
  Plus, 
  Download, 
  Archive, 
  Play, 
  Pause,
  Radio,
  Filter
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export function SweepstakesFilterBar() {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [liveMode, setLiveMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSweepstakes, setSelectedSweepstakes] = useState("all");

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Left side - Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal min-w-[240px]">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    "Pick a date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="ending-soon">Ending Soon</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>

            {/* Sweepstakes Filter */}
            <Select value={selectedSweepstakes} onValueChange={setSelectedSweepstakes}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sweepstakes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sweepstakes</SelectItem>
                <SelectItem value="iphone-giveaway">iPhone Giveaway</SelectItem>
                <SelectItem value="gaming-setup">Gaming Setup</SelectItem>
                <SelectItem value="gift-card">Gift Card</SelectItem>
              </SelectContent>
            </Select>

            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sweepstakes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Right side - Actions and Live Toggle */}
          <div className="flex items-center gap-3">
            {/* Live Mode Toggle */}
            <div className="flex items-center space-x-2 border rounded-lg px-3 py-2">
              <Radio className={`h-4 w-4 ${liveMode ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
              <span className="text-sm font-medium">Live</span>
              <Switch checked={liveMode} onCheckedChange={setLiveMode} />
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Archive className="h-4 w-4 mr-2" />
                Bulk Actions
              </Button>
            </div>

            {/* Primary Action */}
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Sweepstakes
            </Button>
          </div>
        </div>

        {/* Active Filters Display */}
        {(selectedStatus !== 'all' || selectedSweepstakes !== 'all' || searchQuery || dateRange.from) && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {selectedStatus !== 'all' && (
              <Badge variant="secondary" className="capitalize">
                Status: {selectedStatus}
                <button 
                  className="ml-1 hover:text-destructive"
                  onClick={() => setSelectedStatus('all')}
                >
                  ×
                </button>
              </Badge>
            )}
            {selectedSweepstakes !== 'all' && (
              <Badge variant="secondary">
                Sweepstakes: {selectedSweepstakes}
                <button 
                  className="ml-1 hover:text-destructive"
                  onClick={() => setSelectedSweepstakes('all')}
                >
                  ×
                </button>
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary">
                Search: {searchQuery}
                <button 
                  className="ml-1 hover:text-destructive"
                  onClick={() => setSearchQuery('')}
                >
                  ×
                </button>
              </Badge>
            )}
            {dateRange.from && (
              <Badge variant="secondary">
                Date Range
                <button 
                  className="ml-1 hover:text-destructive"
                  onClick={() => setDateRange({})}
                >
                  ×
                </button>
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setSelectedStatus('all');
                setSelectedSweepstakes('all');
                setSearchQuery('');
                setDateRange({});
              }}
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Live Mode Status */}
        {liveMode && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Live data - Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}