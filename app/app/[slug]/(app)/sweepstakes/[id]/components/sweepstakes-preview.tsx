'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Eye,
  ExternalLink,
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw
} from 'lucide-react';
import { useState } from 'react';
import { useSweepstakesDetailsContext } from './use-sweepstakes-details-context';
import Link from 'next/link';

export const SweepstakesPreview: React.FC = () => {
  const { sweepstakes, liveUrl, livePath } = useSweepstakesDetailsContext();

  const [previewDevice, setPreviewDevice] = useState<
    'mobile' | 'tablet' | 'desktop'
  >('desktop');
  const [isLoading, setIsLoading] = useState(false);

  const refreshPreview = async () => {
    setIsLoading(true);
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const getDeviceStyles = () => {
    switch (previewDevice) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      case 'desktop':
        return 'w-full';
      default:
        return 'w-full';
    }
  };

  return (
    <div className="space-y-6">
      {/* Preview Controls */}
      <div className="space-y-4 mt-4">
        <div className="flex items-center justify-center space-x-2">
          {/* Device Selector */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={previewDevice === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewDevice('mobile')}
              className="rounded-r-none"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
            <Button
              variant={previewDevice === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewDevice('tablet')}
              className="rounded-none border-x-0"
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={previewDevice === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewDevice('desktop')}
              className="rounded-l-none"
            >
              <Monitor className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshPreview}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>

          <Button variant="outline" size="sm" asChild>
            <Link href={livePath} target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Link>
          </Button>
        </div>

        {/* Preview Frame */}
        <Card>
          <CardContent className="p-0">
            <div className={`transition-all duration-300 ${getDeviceStyles()}`}>
              <div className="aspect-[4/5] bg-muted rounded-lg overflow-hidden">
                {liveUrl ? (
                  <iframe
                    src={liveUrl}
                    className="w-full h-full border-0"
                    title={`Preview of ${sweepstakes.name}`}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-4">
                      <Eye className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">No Preview Available</h3>
                        <p className="text-sm text-muted-foreground">
                          Landing page URL not configured
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Landing Page Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">URL</label>
              <div className="text-sm text-muted-foreground break-all">
                {liveUrl}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Share URL</label>
              <div className="text-sm text-muted-foreground break-all">
                {liveUrl}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">SEO Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="border rounded p-3 space-y-2">
              <div className="text-blue-600 text-sm font-medium hover:underline cursor-pointer">
                {sweepstakes.name}
              </div>
              <div className="text-xs text-green-600">{liveUrl}</div>
              <div className="text-sm text-gray-600">
                {sweepstakes.description}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
