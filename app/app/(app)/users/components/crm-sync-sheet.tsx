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
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Settings,
  Users,
  TrendingUp,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react';

interface CRMSyncSheetProps {
  open: boolean;
  onClose: () => void;
  selectedUsers: string[];
}

interface SyncJob {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  recordsTotal: number;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  startedAt: string;
  completedAt?: string;
  errors: string[];
}

interface CRMStatus {
  connected: boolean;
  provider: 'Salesforce' | 'HubSpot' | 'Pipedrive' | null;
  lastSyncAt?: string;
  totalSynced: number;
  pendingSync: number;
  failedSync: number;
  apiCalls: number;
  apiLimit: number;
}

// Mock CRM status
const mockCRMStatus: CRMStatus = {
  connected: true,
  provider: 'Salesforce',
  lastSyncAt: '2025-01-13T09:30:00Z',
  totalSynced: 45234,
  pendingSync: 1247,
  failedSync: 23,
  apiCalls: 2847,
  apiLimit: 10000
};

// Mock sync jobs
const mockSyncJobs: SyncJob[] = [
  {
    id: 'sync_1',
    status: 'completed',
    progress: 100,
    recordsTotal: 1250,
    recordsProcessed: 1250,
    recordsSucceeded: 1228,
    recordsFailed: 22,
    startedAt: '2025-01-13T09:30:00Z',
    completedAt: '2025-01-13T09:45:00Z',
    errors: [
      'Invalid email format for user_123',
      'Duplicate contact found for user_456'
    ]
  },
  {
    id: 'sync_2',
    status: 'running',
    progress: 67,
    recordsTotal: 850,
    recordsProcessed: 570,
    recordsSucceeded: 563,
    recordsFailed: 7,
    startedAt: '2025-01-13T10:15:00Z',
    errors: ['Rate limit exceeded - retrying in 60s']
  }
];

export const CRMSyncSheet = ({ open, onClose, selectedUsers }: CRMSyncSheetProps) => {
  const [activeTab, setActiveTab] = useState('status');
  const [crmStatus, setCrmStatus] = useState<CRMStatus>(mockCRMStatus);
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>(mockSyncJobs);
  const [isSyncing, setIsSyncing] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startStr: string, endStr?: string) => {
    const start = new Date(startStr).getTime();
    const end = endStr ? new Date(endStr).getTime() : Date.now();
    const duration = Math.floor((end - start) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  const handleSyncNow = async () => {
    if (!crmStatus.connected || isSyncing) return;

    setIsSyncing(true);
    setActiveTab('logs');

    const newJob: SyncJob = {
      id: `sync_${Date.now()}`,
      status: 'queued',
      progress: 0,
      recordsTotal: selectedUsers.length || 1247,
      recordsProcessed: 0,
      recordsSucceeded: 0,
      recordsFailed: 0,
      startedAt: new Date().toISOString(),
      errors: []
    };

    setSyncJobs(prev => [newJob, ...prev]);

    // Simulate sync progress
    setTimeout(() => {
      setSyncJobs(prev => prev.map(job => 
        job.id === newJob.id 
          ? { ...job, status: 'running', progress: 15, recordsProcessed: Math.floor(newJob.recordsTotal * 0.15) }
          : job
      ));
    }, 1000);

    setTimeout(() => {
      setSyncJobs(prev => prev.map(job => 
        job.id === newJob.id 
          ? { 
              ...job, 
              progress: 45, 
              recordsProcessed: Math.floor(newJob.recordsTotal * 0.45),
              recordsSucceeded: Math.floor(newJob.recordsTotal * 0.42),
              recordsFailed: Math.floor(newJob.recordsTotal * 0.03)
            }
          : job
      ));
    }, 3000);

    setTimeout(() => {
      setSyncJobs(prev => prev.map(job => 
        job.id === newJob.id 
          ? { 
              ...job, 
              progress: 85, 
              recordsProcessed: Math.floor(newJob.recordsTotal * 0.85),
              recordsSucceeded: Math.floor(newJob.recordsTotal * 0.82),
              recordsFailed: Math.floor(newJob.recordsTotal * 0.03)
            }
          : job
      ));
    }, 5000);

    setTimeout(() => {
      setSyncJobs(prev => prev.map(job => 
        job.id === newJob.id 
          ? { 
              ...job, 
              status: 'completed',
              progress: 100, 
              recordsProcessed: newJob.recordsTotal,
              recordsSucceeded: Math.floor(newJob.recordsTotal * 0.96),
              recordsFailed: Math.floor(newJob.recordsTotal * 0.04),
              completedAt: new Date().toISOString(),
              errors: ['Rate limit warning: 3 requests throttled', 'Invalid phone number for user_789']
            }
          : job
      ));
      
      // Update CRM status
      setCrmStatus(prev => ({
        ...prev,
        lastSyncAt: new Date().toISOString(),
        totalSynced: prev.totalSynced + Math.floor(newJob.recordsTotal * 0.96),
        pendingSync: Math.max(0, prev.pendingSync - newJob.recordsTotal),
        apiCalls: prev.apiCalls + newJob.recordsTotal
      }));
      
      setIsSyncing(false);
    }, 8000);
  };

  const getSyncStatusBadge = (status: SyncJob['status']) => {
    const variants = {
      queued: { variant: 'secondary' as const, label: 'Queued', icon: Clock },
      running: { variant: 'default' as const, label: 'Running', icon: RefreshCw },
      completed: { variant: 'default' as const, label: 'Completed', icon: CheckCircle },
      failed: { variant: 'destructive' as const, label: 'Failed', icon: AlertTriangle }
    };
    
    const config = variants[status];
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="text-xs">
        <IconComponent className={`h-3 w-3 mr-1 ${status === 'running' ? 'animate-spin' : ''}`} />
        {config.label}
      </Badge>
    );
  };

  const currentJob = syncJobs.find(job => job.status === 'running');
  const apiUsagePercentage = (crmStatus.apiCalls / crmStatus.apiLimit) * 100;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto px-4 sm:px-6">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5" />
            <span>CRM Sync</span>
            {crmStatus.connected ? (
              <Badge variant="default" className="text-xs">
                <Wifi className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-xs">
                <WifiOff className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            Sync user data with your CRM system and monitor progress.
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="status">Status & Settings</TabsTrigger>
            <TabsTrigger value="logs">Sync Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4 mt-4">
            {!crmStatus.connected ? (
              <div className="text-center py-8">
                <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="font-medium text-lg">No CRM Connected</h3>
                  <p className="text-muted-foreground">
                    Connect your CRM system to sync user data automatically.
                  </p>
                  <Button className="mt-4">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Connect CRM
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Connection Status */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">Connected to {crmStatus.provider}</h3>
                      <Badge variant="default" className="text-xs">Active</Badge>
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-1" />
                      Settings
                    </Button>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Last sync: {crmStatus.lastSyncAt ? formatDate(crmStatus.lastSyncAt) : 'Never'}
                  </div>
                </div>

                <Separator />

                {/* Sync Statistics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {crmStatus.totalSynced.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Synced</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-yellow-600">
                      {crmStatus.pendingSync.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">
                      {crmStatus.failedSync.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </div>
                </div>

                {/* API Usage */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>API Usage</span>
                    <span>{crmStatus.apiCalls.toLocaleString()} / {crmStatus.apiLimit.toLocaleString()}</span>
                  </div>
                  <Progress value={apiUsagePercentage} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {(100 - apiUsagePercentage).toFixed(1)}% remaining this month
                  </div>
                </div>

                {/* Current Sync Status */}
                {currentJob && (
                  <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium text-blue-800">Sync in Progress</div>
                      {getSyncStatusBadge(currentJob.status)}
                    </div>
                    
                    <div className="space-y-2">
                      <Progress value={currentJob.progress} className="h-2" />
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Processed:</span>
                          <span className="font-medium ml-1">
                            {currentJob.recordsProcessed}/{currentJob.recordsTotal}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Success:</span>
                          <span className="font-medium ml-1 text-green-600">
                            {currentJob.recordsSucceeded}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Failed:</span>
                          <span className="font-medium ml-1 text-red-600">
                            {currentJob.recordsFailed}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-blue-600">
                        Running for {formatDuration(currentJob.startedAt)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sync Options */}
                <div className="space-y-3">
                  <div className="font-medium text-sm">Sync Options</div>
                  <div className="space-y-2 text-sm">
                    {selectedUsers.length > 0 ? (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>Sync Selected Users ({selectedUsers.length})</span>
                        </div>
                        <Badge variant="outline" className="text-xs">Selected</Badge>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span>Sync Pending Users ({crmStatus.pendingSync})</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">All Pending</Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="logs" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Recent Sync Jobs</div>
                <Badge variant="outline" className="text-xs">
                  {syncJobs.length} jobs
                </Badge>
              </div>
              
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {syncJobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-sm">
                          Sync Job #{job.id.split('_')[1]}
                        </div>
                        {getSyncStatusBadge(job.status)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(job.startedAt)}
                      </div>
                    </div>
                    
                    {job.status === 'running' && (
                      <div className="space-y-2 mb-3">
                        <Progress value={job.progress} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {job.progress}% complete • Running for {formatDuration(job.startedAt)}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total:</span>
                        <div className="font-medium">{job.recordsTotal}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Processed:</span>
                        <div className="font-medium">{job.recordsProcessed}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Success:</span>
                        <div className="font-medium text-green-600">{job.recordsSucceeded}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Failed:</span>
                        <div className="font-medium text-red-600">{job.recordsFailed}</div>
                      </div>
                    </div>
                    
                    {job.completedAt && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Completed in {formatDuration(job.startedAt, job.completedAt)}
                      </div>
                    )}
                    
                    {job.errors.length > 0 && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="text-xs font-medium text-yellow-800 mb-1">
                          Warnings & Errors ({job.errors.length})
                        </div>
                        <div className="space-y-1">
                          {job.errors.slice(0, 3).map((error, index) => (
                            <div key={index} className="text-xs text-yellow-700">
                              • {error}
                            </div>
                          ))}
                          {job.errors.length > 3 && (
                            <div className="text-xs text-yellow-600">
                              +{job.errors.length - 3} more errors
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {syncJobs.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No sync jobs yet</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4 border-t mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {crmStatus.connected && (
            <Button 
              onClick={handleSyncNow}
              disabled={isSyncing || !!currentJob}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};