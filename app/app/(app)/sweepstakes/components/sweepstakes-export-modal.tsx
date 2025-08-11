"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Download, 
  FileText, 
  Calendar,
  Clock,
  Database,
  Settings,
  CheckCircle
} from "lucide-react";
import { useState } from "react";

export function SweepstakesExportModal() {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'email', 'name', 'entry_date', 'source'
  ]);
  const [exportFormat, setExportFormat] = useState('csv');
  const [dateRange, setDateRange] = useState('all');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [scheduleExport, setScheduleExport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const availableColumns = [
    { id: 'email', label: 'Email Address', essential: true },
    { id: 'name', label: 'Full Name', essential: true },
    { id: 'entry_date', label: 'Entry Date', essential: false },
    { id: 'source', label: 'Traffic Source', essential: false },
    { id: 'ip_address', label: 'IP Address', essential: false },
    { id: 'location', label: 'Location', essential: false },
    { id: 'sweepstakes', label: 'Sweepstakes Name', essential: false },
    { id: 'verification_status', label: 'Email Verification', essential: false },
    { id: 'quality_score', label: 'Quality Score', essential: false },
    { id: 'referrer', label: 'Referrer URL', essential: false }
  ];

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnId) 
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsExporting(false);
    
    // In real implementation, this would trigger the actual export
    console.log('Export configuration:', {
      columns: selectedColumns,
      format: exportFormat,
      dateRange,
      includeHeaders,
      scheduled: scheduleExport
    });
  };

  const getColumnCount = () => selectedColumns.length;
  const getEstimatedRows = () => {
    // Mock estimation based on date range
    switch (dateRange) {
      case 'today': return 156;
      case 'week': return 1234;
      case 'month': return 4567;
      case 'all': return 15420;
      default: return 0;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Download className="h-5 w-5" />
          <span>Export & Scheduling</span>
        </CardTitle>
        <CardDescription>
          Export entry data and schedule automated reports
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-3 sm:p-6">
        <div className="space-y-6">
          {/* Export Format */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={exportFormat === 'csv' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExportFormat('csv')}
                className="justify-start"
              >
                <FileText className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant={exportFormat === 'json' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExportFormat('json')}
                className="justify-start"
              >
                <Database className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Date Range</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Column Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Columns to Export</Label>
              <Badge variant="secondary">
                {getColumnCount()} of {availableColumns.length} selected
              </Badge>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableColumns.map((column) => (
                <div key={column.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={column.id}
                    checked={selectedColumns.includes(column.id)}
                    onCheckedChange={() => handleColumnToggle(column.id)}
                  />
                  <Label htmlFor={column.id} className="text-sm flex-1 cursor-pointer">
                    {column.label}
                    {column.essential && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Essential
                      </Badge>
                    )}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedColumns(availableColumns.map(c => c.id))}
              >
                Select All
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedColumns(availableColumns.filter(c => c.essential).map(c => c.id))}
              >
                Essential Only
              </Button>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Export Options</Label>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="headers"
                checked={includeHeaders}
                onCheckedChange={setIncludeHeaders}
              />
              <Label htmlFor="headers" className="text-sm cursor-pointer">
                Include column headers
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="schedule"
                checked={scheduleExport}
                onCheckedChange={setScheduleExport}
              />
              <Label htmlFor="schedule" className="text-sm cursor-pointer">
                Schedule recurring export
              </Label>
            </div>
          </div>

          {/* Scheduled Export Settings */}
          {scheduleExport && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <Label className="text-sm font-medium">Schedule Settings</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Frequency</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email To</Label>
                  <Input 
                    placeholder="admin@example.com" 
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Export Preview */}
          <div className="p-3 border rounded-lg bg-blue-50">
            <div className="flex items-center space-x-2 mb-2">
              <Settings className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800 text-sm">Export Preview</span>
            </div>
            <div className="text-sm text-blue-600 space-y-1">
              <div>Format: <span className="font-medium uppercase">{exportFormat}</span></div>
              <div>Columns: <span className="font-medium">{getColumnCount()}</span></div>
              <div>Estimated rows: <span className="font-medium">{getEstimatedRows().toLocaleString()}</span></div>
              <div>Date range: <span className="font-medium capitalize">{dateRange.replace('_', ' ')}</span></div>
            </div>
          </div>

          {/* Export Actions */}
          <div className="flex space-x-2">
            <Button 
              onClick={handleExport}
              disabled={isExporting || getColumnCount() === 0}
              className="flex-1"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Now
                </>
              )}
            </Button>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>

          {/* Recent Exports */}
          <div className="space-y-3 pt-4 border-t">
            <Label className="text-sm font-medium">Recent Exports</Label>
            <div className="space-y-2">
              {[
                { name: 'all-entries-january.csv', date: '2 hours ago', size: '2.4 MB' },
                { name: 'verified-users-weekly.csv', date: '1 day ago', size: '1.8 MB' },
                { name: 'sweepstakes-summary.json', date: '3 days ago', size: '847 KB' }
              ].map((export_, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{export_.name}</div>
                    <div className="text-xs text-muted-foreground">{export_.date} • {export_.size}</div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <Button variant="ghost" size="sm">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}