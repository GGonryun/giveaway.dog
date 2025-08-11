"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Play,
  Pause,
  Edit,
  Share,
  Copy,
  ExternalLink,
  Settings,
  MoreHorizontal,
  Calendar,
  Users,
  Target,
  Clock,
  Gift
} from "lucide-react";
import Link from "next/link";

interface SweepstakesDetails {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'ending-soon' | 'draft' | 'paused' | 'completed';
  prize: string;
  entries: number;
  uniqueEntrants: number;
  conversionRate: number;
  botRate: number;
  timeLeft: string;
  createdAt: string;
  endsAt: string;
  topSource: string;
  landingPageUrl: string;
  shareUrl: string;
  thumbnailUrl?: string;
}

interface SweepstakesDetailHeaderProps {
  sweepstakes: SweepstakesDetails;
}

export function SweepstakesDetailHeader({ sweepstakes }: SweepstakesDetailHeaderProps) {
  const getStatusBadge = (status: SweepstakesDetails['status']) => {
    const variants = {
      active: { variant: 'default' as const, label: 'Active' },
      'ending-soon': { variant: 'destructive' as const, label: 'Ending Soon' },
      draft: { variant: 'secondary' as const, label: 'Draft' },
      paused: { variant: 'outline' as const, label: 'Paused' },
      completed: { variant: 'secondary' as const, label: 'Completed' }
    };
    
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Back Button and Main Info */}
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <Button variant="ghost" size="sm" asChild className="pl-0">
                <Link href="/app/sweepstakes">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sweepstakes
                </Link>
              </Button>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold">{sweepstakes.title}</h1>
                  {getStatusBadge(sweepstakes.status)}
                </div>
                <p className="text-muted-foreground max-w-2xl">
                  {sweepstakes.description}
                </p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Gift className="h-4 w-4" />
                    <span>{sweepstakes.prize}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(sweepstakes.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{sweepstakes.timeLeft}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={sweepstakes.landingPageUrl} target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Live
                </Link>
              </Button>
              
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(sweepstakes.shareUrl)}>
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              
              {sweepstakes.status === 'active' && (
                <Button variant="outline" size="sm">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              
              {sweepstakes.status === 'paused' && (
                <Button variant="default" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Advanced Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Entries</span>
              </div>
              <div className="text-2xl font-bold">{sweepstakes.entries.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                {sweepstakes.uniqueEntrants.toLocaleString()} unique
              </div>
            </div>
            
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-1">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Conversion</span>
              </div>
              <div className="text-2xl font-bold">{sweepstakes.conversionRate.toFixed(1)}%</div>
              <div className={`text-xs ${
                sweepstakes.conversionRate > 8 ? 'text-green-600' : 
                sweepstakes.conversionRate > 5 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {sweepstakes.conversionRate > 8 ? 'Excellent' : 
                 sweepstakes.conversionRate > 5 ? 'Good' : 'Needs work'}
              </div>
            </div>
            
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Time Left</span>
              </div>
              <div className="text-lg font-bold">{sweepstakes.timeLeft}</div>
              <div className="text-xs text-muted-foreground">
                Ends {new Date(sweepstakes.endsAt).toLocaleDateString()}
              </div>
            </div>
            
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-1">
                <Share className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Top Source</span>
              </div>
              <div className="text-lg font-bold">{sweepstakes.topSource}</div>
              <div className="text-xs text-muted-foreground">
                Primary traffic
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}