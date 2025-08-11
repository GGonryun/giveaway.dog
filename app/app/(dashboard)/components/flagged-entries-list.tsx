"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check, X, Eye, RefreshCw, ExternalLink } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface FlaggedEntry {
  id: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  flaggedAt: string;
  flagReason: string;
  riskScore: number;
  entryCount: number;
  ipAddress: string;
  location?: string;
  sweepstakesName: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface FlaggedEntriesListProps {
  entries: FlaggedEntry[];
}

export function FlaggedEntriesList({ entries }: FlaggedEntriesListProps) {
  const [localEntries, setLocalEntries] = useState(entries);
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (entryId: string, action: 'approve' | 'reject') => {
    setLoading(entryId);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setLocalEntries(prev => 
      prev.map(entry => 
        entry.id === entryId 
          ? { ...entry, status: action === 'approve' ? 'approved' : 'rejected' }
          : entry
      )
    );
    
    setLoading(null);
  };

  const getRiskBadge = (score: number) => {
    if (score >= 80) return <Badge variant="destructive">High Risk</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-500">Medium Risk</Badge>;
    return <Badge variant="secondary">Low Risk</Badge>;
  };

  const getStatusBadge = (status: FlaggedEntry['status']) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive'
    } as const;
    
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const pendingEntries = localEntries.filter(entry => entry.status === 'pending');
  const reviewedEntries = localEntries.filter(entry => entry.status !== 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <span>Flagged Entries</span>
          {pendingEntries.length > 0 && (
            <Badge variant="destructive">{pendingEntries.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Review and moderate suspicious contest entries
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="space-y-6">
          {/* Pending Review Section */}
          {pendingEntries.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Pending Review ({pendingEntries.length})</h3>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Bulk Actions
                </Button>
              </div>
              
              <div className="space-y-3">
                {pendingEntries.map((entry) => (
                  <div 
                    key={entry.id} 
                    className="border border-yellow-200 bg-yellow-50 p-4 rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={entry.userAvatar} alt={entry.userName} />
                          <AvatarFallback className="text-xs">
                            {getInitials(entry.userName)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-sm">{entry.userName}</h4>
                            {getRiskBadge(entry.riskScore)}
                          </div>
                          <p className="text-xs text-muted-foreground">{entry.userEmail}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>IP: {entry.ipAddress}</span>
                            {entry.location && <span>📍 {entry.location}</span>}
                            <span>{entry.entryCount} entries</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={loading === entry.id}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-red-700">
                            Flag Reason: {entry.flagReason}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Sweepstakes: {entry.sweepstakesName} • Flagged: {entry.flaggedAt}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 pt-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleAction(entry.id, 'approve')}
                          disabled={loading === entry.id}
                        >
                          {loading === entry.id ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 mr-2" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction(entry.id, 'reject')}
                          disabled={loading === entry.id}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recently Reviewed Section */}
          {reviewedEntries.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-sm border-t pt-4">
                Recently Reviewed ({reviewedEntries.length})
              </h3>
              
              <div className="space-y-2">
                {reviewedEntries.slice(0, 5).map((entry) => (
                  <div 
                    key={entry.id} 
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={entry.userAvatar} alt={entry.userName} />
                        <AvatarFallback className="text-xs">
                          {getInitials(entry.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{entry.userName}</div>
                        <div className="text-xs text-muted-foreground">{entry.flagReason}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(entry.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {localEntries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Check className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No flagged entries to review</p>
              <p className="text-xs">All entries are looking good!</p>
            </div>
          )}

          {/* View All Flagged Users Button */}
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/app/users/review">
                <ExternalLink className="h-4 w-4 mr-2" />
                View All Flagged Users
              </Link>
            </Button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t text-sm">
            <div>
              <div className="text-muted-foreground">Pending</div>
              <div className="font-medium text-yellow-600">{pendingEntries.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Approved</div>
              <div className="font-medium text-green-600">
                {localEntries.filter(e => e.status === 'approved').length}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Rejected</div>
              <div className="font-medium text-red-600">
                {localEntries.filter(e => e.status === 'rejected').length}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">High Risk</div>
              <div className="font-medium text-red-600">
                {localEntries.filter(e => e.riskScore >= 80).length}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}