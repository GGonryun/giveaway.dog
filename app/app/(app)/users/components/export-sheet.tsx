'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Download,
  FileText,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

interface ExportSheetProps {
  open: boolean;
  onClose: () => void;
  selectedUsers: string[];
  totalUsers: number;
}

interface ExportJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  fileName: string;
  format: string;
  recordCount: number;
  createdAt: string;
  downloadUrl?: string;
  error?: string;
}

// Mock export jobs
const mockExportJobs: ExportJob[] = [
  {
    id: 'job_1',
    status: 'completed',
    progress: 100,
    fileName: 'users_export_2025_01_13.csv',
    format: 'CSV',
    recordCount: 12459,
    createdAt: '2025-01-13T10:30:00Z',
    downloadUrl: '/exports/users_export_2025_01_13.csv'
  },
  {
    id: 'job_2',
    status: 'processing',
    progress: 67,
    fileName: 'users_filtered_export.xlsx',
    format: 'XLSX',
    recordCount: 8934,
    createdAt: '2025-01-13T09:15:00Z'
  },
  {
    id: 'job_3',
    status: 'failed',
    progress: 0,
    fileName: 'users_export_failed.csv',
    format: 'CSV',
    recordCount: 0,
    createdAt: '2025-01-12T16:45:00Z',
    error: 'Database connection timeout'
  }
];

const availableColumns = [
  { id: 'id', label: 'User ID', required: true },
  { id: 'name', label: 'Name', required: false },
  { id: 'email', label: 'Email', required: true },
  { id: 'status', label: 'Status', required: false },
  { id: 'qualityScore', label: 'Quality Score', required: false },
  { id: 'engagement', label: 'Engagement Rate', required: false },
  { id: 'totalEntries', label: 'Total Entries', required: false },
  { id: 'totalWins', label: 'Total Wins', required: false },
  { id: 'joinedAt', label: 'Join Date', required: false },
  { id: 'lastActive', label: 'Last Active', required: false },
  { id: 'location', label: 'Location', required: false },
  { id: 'source', label: 'Source', required: false },
  { id: 'tags', label: 'Tags', required: false },
  { id: 'deviceInfo', label: 'Device Info', required: false },
  { id: 'ipAddress', label: 'IP Address', required: false },
  { id: 'riskScore', label: 'Risk Score', required: false }
];

export const ExportSheet = ({ open, onClose, selectedUsers, totalUsers }: ExportSheetProps) => {
  const [activeTab, setActiveTab] = useState('configure');
  const [format, setFormat] = useState('CSV');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'id', 'name', 'email', 'status', 'qualityScore', 'totalEntries', 'joinedAt'
  ]);
  const [exportType, setExportType] = useState<'selected' | 'filtered' | 'all'>('selected');
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleType, setScheduleType] = useState('immediate');
  const [exportJobs, setExportJobs] = useState<ExportJob[]>(mockExportJobs);
  
  useEffect(() => {
    if (selectedUsers.length > 0) {
      setExportType('selected');
    } else {
      setExportType('all');
    }
  }, [selectedUsers.length]);

  useEffect(() => {
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const baseFileName = exportType === 'selected' ? 'selected_users' : 
                        exportType === 'filtered' ? 'filtered_users' : 'all_users';
    setFileName(`${baseFileName}_${timestamp}`);
  }, [exportType]);

  const handleColumnToggle = (columnId: string) => {
    const column = availableColumns.find(col => col.id === columnId);
    if (column?.required) return; // Can't toggle required columns
    
    setSelectedColumns(prev => 
      prev.includes(columnId) 
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleExport = async () => {
    const newJob: ExportJob = {
      id: `job_${Date.now()}`,
      status: 'queued',
      progress: 0,
      fileName: `${fileName}.${format.toLowerCase()}`,
      format,
      recordCount: exportType === 'selected' ? selectedUsers.length : 
                  exportType === 'filtered' ? 8934 : totalUsers,
      createdAt: new Date().toISOString()
    };

    setExportJobs(prev => [newJob, ...prev]);
    setActiveTab('jobs');

    // Simulate job processing
    setTimeout(() => {
      setExportJobs(prev => prev.map(job => 
        job.id === newJob.id 
          ? { ...job, status: 'processing', progress: 25 }
          : job
      ));
    }, 1000);

    setTimeout(() => {
      setExportJobs(prev => prev.map(job => 
        job.id === newJob.id 
          ? { ...job, progress: 75 }
          : job
      ));
    }, 3000);

    setTimeout(() => {
      setExportJobs(prev => prev.map(job => 
        job.id === newJob.id 
          ? { 
              ...job, 
              status: 'completed', 
              progress: 100,
              downloadUrl: `/exports/${job.fileName}`
            }
          : job
      ));
    }, 5000);
  };

  const getJobStatusBadge = (status: ExportJob['status']) => {
    const variants = {
      queued: { variant: 'secondary' as const, label: 'Queued', icon: Clock },
      processing: { variant: 'default' as const, label: 'Processing', icon: Download },
      completed: { variant: 'default' as const, label: 'Completed', icon: CheckCircle },
      failed: { variant: 'destructive' as const, label: 'Failed', icon: AlertTriangle }
    };
    
    const config = variants[status];
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="text-xs">
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRecordCount = () => {
    switch (exportType) {
      case 'selected':
        return selectedUsers.length;
      case 'filtered':
        return 8934; // Mock filtered count
      case 'all':
        return totalUsers;
      default:
        return 0;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto px-4 sm:px-6">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Export Users</span>
          </SheetTitle>
          <SheetDescription>
            Configure your export settings and download user data.
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configure">Configure Export</TabsTrigger>
            <TabsTrigger value="jobs">Export Jobs</TabsTrigger>
          </TabsList>

          <TabsContent value="configure" className="space-y-4 mt-4">
            {/* Export Scope */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Export Scope</Label>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="selected"
                    checked={exportType === 'selected'}
                    onCheckedChange={() => setExportType('selected')}
                    disabled={selectedUsers.length === 0}
                  />
                  <Label htmlFor="selected" className="text-sm cursor-pointer">
                    Selected Users ({selectedUsers.length})
                  </Label>
                  {selectedUsers.length === 0 && (
                    <Badge variant="secondary" className="text-xs">No selection</Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="filtered"
                    checked={exportType === 'filtered'}
                    onCheckedChange={() => setExportType('filtered')}
                  />
                  <Label htmlFor="filtered" className="text-sm cursor-pointer">
                    Current Filter Results (8,934)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="all"
                    checked={exportType === 'all'}
                    onCheckedChange={() => setExportType('all')}
                  />
                  <Label htmlFor="all" className="text-sm cursor-pointer">
                    All Users ({totalUsers.toLocaleString()})
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Format Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSV">CSV</SelectItem>
                    <SelectItem value="XLSX">Excel (XLSX)</SelectItem>
                    <SelectItem value="JSON">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">File Name</Label>
                <Input
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Enter file name"
                />
              </div>
            </div>

            {/* Column Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Columns to Include</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-3">
                {availableColumns.map((column) => (
                  <div key={column.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.id}
                      checked={selectedColumns.includes(column.id)}
                      onCheckedChange={() => handleColumnToggle(column.id)}
                      disabled={column.required}
                    />
                    <Label 
                      htmlFor={column.id} 
                      className={`text-sm cursor-pointer ${column.required ? 'font-medium' : ''}`}
                    >
                      {column.label}
                      {column.required && (
                        <Badge variant="secondary" className="ml-1 text-xs">Required</Badge>
                      )}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                {selectedColumns.length} of {availableColumns.length} columns selected
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Description (Optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description for this export..."
                className="h-16 resize-none"
              />
            </div>

            {/* Export Summary */}
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-sm font-medium mb-2">Export Summary</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Records: <span className="font-medium">{getRecordCount().toLocaleString()}</span></div>
                <div>Columns: <span className="font-medium">{selectedColumns.length}</span></div>
                <div>Format: <span className="font-medium">{format}</span></div>
                <div>Est. Size: <span className="font-medium">~{Math.ceil(getRecordCount() / 1000)}MB</span></div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Recent Export Jobs</div>
                <Badge variant="outline" className="text-xs">
                  {exportJobs.length} jobs
                </Badge>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {exportJobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">{job.fileName}</div>
                      {getJobStatusBadge(job.status)}
                    </div>
                    
                    <div className="text-xs text-muted-foreground mb-2">
                      {job.recordCount.toLocaleString()} records • {job.format} • {formatDate(job.createdAt)}
                    </div>
                    
                    {job.status === 'processing' && (
                      <div className="space-y-1">
                        <Progress value={job.progress} className="h-2" />
                        <div className="text-xs text-muted-foreground">{job.progress}% complete</div>
                      </div>
                    )}
                    
                    {job.status === 'completed' && job.downloadUrl && (
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    )}
                    
                    {job.status === 'failed' && job.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        Error: {job.error}
                      </div>
                    )}
                  </div>
                ))}
                
                {exportJobs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No export jobs yet</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {activeTab === 'configure' && (
            <Button 
              onClick={handleExport}
              disabled={selectedColumns.length === 0 || !fileName.trim()}
            >
              <Download className="h-4 w-4 mr-1" />
              Start Export
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};