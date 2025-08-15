'use client';

import { useState } from 'react';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Users,
  X,
  Download,
  RefreshCw,
  Tag,
  UserCheck,
  UserX,
  Trash2,
  CheckCircle,
  Clock
} from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onExport: () => void;
  onCRMSync: () => void;
}

export const BulkActionsBar = ({
  selectedCount,
  onClearSelection,
  onExport,
  onCRMSync
}: BulkActionsBarProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [actionTag, setActionTag] = useState<string>('');

  const handleBulkAction = async (action: string) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsLoading(false);
    console.log(`Performing ${action} on ${selectedCount} users`);
    
    // Clear selection after successful action
    onClearSelection();
  };

  const availableTags = [
    'VIP Customer',
    'High Value',
    'Frequent Participant', 
    'Suspicious Activity',
    'Marketing Qualified',
    'Review Required'
  ];

  return (
    <Card className="border-blue-200 bg-blue-50 shadow-lg max-w-4xl">
      <CardContent className="px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3 text-blue-600 flex-shrink-0" />
              <span className="font-medium text-blue-800 text-xs sm:text-sm truncate">
                {selectedCount} user{selectedCount !== 1 ? 's' : ''}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-blue-600 hover:text-blue-800 h-6 px-1 sm:h-8 sm:px-2"
            >
              <X className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto">
            {/* Export Selected */}
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              disabled={isLoading}
              className="h-6 px-2 sm:h-8 sm:px-3 flex-shrink-0"
            >
              <Download className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Export</span>
            </Button>

            {/* CRM Sync */}
            <Button
              variant="outline"
              size="sm"
              onClick={onCRMSync}
              disabled={isLoading}
              className="h-6 px-2 sm:h-8 sm:px-3 flex-shrink-0"
            >
              <RefreshCw className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">CRM</span>
            </Button>

            {/* Tag Users */}
            <div className="hidden md:flex items-center space-x-1">
              <Select value={actionTag} onValueChange={setActionTag}>
                <SelectTrigger className="w-32 h-6 sm:w-40 sm:h-8">
                  <SelectValue placeholder="Tag..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTags.map(tag => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction(`tag:${actionTag}`)}
                disabled={!actionTag || isLoading}
                className="h-6 px-2 sm:h-8 sm:px-3 flex-shrink-0"
              >
                <Tag className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Tag</span>
              </Button>
            </div>

            {/* Quick Actions */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline" 
                  size="sm"
                  className="text-green-600 border-green-200 hover:bg-green-50 h-6 px-2 sm:h-8 sm:px-3 flex-shrink-0"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Clock className="h-3 w-3 sm:mr-1 animate-spin" />
                  ) : (
                    <UserCheck className="h-3 w-3 sm:mr-1" />
                  )}
                  <span className="hidden sm:inline">Trust</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Mark Users as Trusted</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to mark {selectedCount} selected user{selectedCount !== 1 ? 's' : ''} as trusted? 
                    This action will:
                    <ul className="mt-2 text-sm list-disc list-inside space-y-1">
                      <li>Remove any existing flags</li>
                      <li>Set quality score boost</li>
                      <li>Whitelist for future entries</li>
                      <li>Create an audit log entry</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleBulkAction('mark_trusted')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark as Trusted
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 h-6 px-2 sm:h-8 sm:px-3 flex-shrink-0"
                  disabled={isLoading}
                >
                  <UserX className="h-3 w-3 sm:mr-1" />
                  <span className="hidden sm:inline">Block</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Block Selected Users</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to block {selectedCount} selected user{selectedCount !== 1 ? 's' : ''}? 
                    This action will:
                    <ul className="mt-2 text-sm list-disc list-inside space-y-1">
                      <li>Prevent future sweepstakes entries</li>
                      <li>Invalidate existing entries</li>
                      <li>Add to blocklist</li>
                      <li>Create an audit log entry</li>
                    </ul>
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <strong>This action cannot be easily undone.</strong>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleBulkAction('block')}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <UserX className="h-4 w-4 mr-1" />
                    Block Users
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Delete Users - Most Destructive */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 h-6 px-2 sm:h-8 sm:px-3 flex-shrink-0"
                  disabled={isLoading}
                >
                  <Trash2 className="h-3 w-3 sm:mr-1" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Selected Users</AlertDialogTitle>
                  <AlertDialogDescription>
                    <div className="space-y-3">
                      <div className="p-3 bg-red-50 border border-red-200 rounded">
                        <strong className="text-red-800">⚠️ DESTRUCTIVE ACTION</strong>
                      </div>
                      
                      <p>
                        Are you sure you want to permanently delete {selectedCount} selected user{selectedCount !== 1 ? 's' : ''}?
                      </p>
                      
                      <div className="text-sm space-y-1">
                        <strong>This will permanently:</strong>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Delete all user data and entries</li>
                          <li>Remove from all sweepstakes</li>
                          <li>Clear CRM sync records</li>
                          <li>Create audit log entries</li>
                        </ul>
                      </div>
                      
                      <div className="p-2 bg-red-100 border border-red-300 rounded text-sm">
                        <strong>This action cannot be undone.</strong> Consider blocking users instead of deleting them.
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleBulkAction('delete')}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Forever
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Progress indicator when loading */}
        {isLoading && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <Clock className="h-4 w-4 animate-spin" />
              <span>Processing bulk action on {selectedCount} users...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};