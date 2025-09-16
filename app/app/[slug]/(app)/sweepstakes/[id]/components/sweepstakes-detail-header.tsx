'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, BadgeVariants } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { useSweepstakesPage } from '@/components/sweepstakes/use-sweepstakes-page';
import { SweepstakesDetailsSchema } from '@/schemas/giveaway/public';
import { useBrowseSweepstakesPage } from '@/components/sweepstakes/use-browse-sweepstakes-page';
import { useMemo } from 'react';
import { useUrl } from '@/components/hooks/use-url';
import { toast } from 'sonner';

export const SweepstakesDetailHeader: React.FC<{
  sweepstakes: SweepstakesDetailsSchema;
}> = ({ sweepstakes }) => {
  const sweepstakesId = useMemo(() => sweepstakes.id, [sweepstakes.id]);
  const page = useSweepstakesPage();
  const browse = useBrowseSweepstakesPage();

  const livePath = browse.path({ sweepstakesId });
  const shareUrl = useUrl({ pathname: livePath });

  const getStatusBadge = (status: SweepstakesDetailsSchema['status']) => {
    const variants: Record<
      SweepstakesDetailsSchema['status'],
      { variant: BadgeVariants; label: string }
    > = {
      ACTIVE: { variant: 'default', label: 'Active' },
      DRAFT: { variant: 'secondary', label: 'Draft' },
      PAUSED: { variant: 'outline', label: 'Paused' },
      COMPLETED: { variant: 'secondary', label: 'Completed' },
      CANCELED: { variant: 'destructive', label: 'Canceled' }
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleShare = () => {
    copyToClipboard(shareUrl);
    toast.success('Link copied to clipboard');
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Back Button and Main Info */}
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <Button variant="ghost" size="sm" asChild className="pl-0">
                <Link href={page.path}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Sweepstakes
                </Link>
              </Button>

              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold">{sweepstakes.name}</h1>
                  {getStatusBadge(sweepstakes.status)}
                </div>
                <p className="text-muted-foreground max-w-2xl">
                  {sweepstakes.description}
                </p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Created{' '}
                      {new Date(sweepstakes.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{sweepstakes.timeLeft}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Responsive */}
            <div className="flex items-center space-x-2">
              {/* Desktop Actions */}
              <div className="hidden md:flex items-center space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={livePath} target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Live
                  </Link>
                </Button>

                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>

                {sweepstakes.status === 'ACTIVE' && (
                  <Button variant="outline" size="sm">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                )}

                {sweepstakes.status === 'PAUSED' && (
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

              {/* Mobile Actions - All in dropdown */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href={livePath} target="_blank">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Live
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyToClipboard(shareUrl)}>
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {sweepstakes.status === 'ACTIVE' && (
                      <DropdownMenuItem>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </DropdownMenuItem>
                    )}
                    {sweepstakes.status === 'PAUSED' && (
                      <DropdownMenuItem>
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </DropdownMenuItem>
                    )}
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
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Entries</span>
              </div>
              <div className="text-2xl font-bold">
                {sweepstakes.totalEntries.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {sweepstakes.totalUsers.toLocaleString()} unique
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-1">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Conversion</span>
              </div>
              <div className="text-2xl font-bold">
                {sweepstakes.conversionRate.toFixed(1)}%
              </div>
              <div
                className={`text-xs ${
                  sweepstakes.conversionRate > 8
                    ? 'text-green-600'
                    : sweepstakes.conversionRate > 5
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {sweepstakes.conversionRate > 8
                  ? 'Excellent'
                  : sweepstakes.conversionRate > 5
                    ? 'Good'
                    : 'Needs work'}
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
};
