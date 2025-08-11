"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, ExternalLink, Smartphone, Monitor, Tablet, RefreshCw } from "lucide-react";
import { useState } from "react";

interface SweepstakesDetails {
  id: string;
  title: string;
  description: string;
  status: string;
  prize: string;
  landingPageUrl: string;
  shareUrl: string;
  thumbnailUrl?: string;
}

interface SweepstakesPreviewProps {
  sweepstakes: SweepstakesDetails;
}

export function SweepstakesPreview({ sweepstakes }: SweepstakesPreviewProps) {
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isLoading, setIsLoading] = useState(false);

  const refreshPreview = async () => {
    setIsLoading(true);
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">Landing Page Preview</h2>
          <Badge variant="outline">Live Preview</Badge>
        </div>
        
        <div className="flex items-center space-x-2">
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
          
          <Button variant="outline" size="sm" onClick={refreshPreview} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <a href={sweepstakes.landingPageUrl} target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </a>
          </Button>
        </div>
      </div>

      {/* Preview Frame */}
      <Card>
        <CardContent className="p-0">
          <div className={`transition-all duration-300 ${getDeviceStyles()}`}>
            <div className="aspect-[4/5] bg-muted rounded-lg overflow-hidden">
              {sweepstakes.landingPageUrl ? (
                <iframe
                  src={sweepstakes.landingPageUrl}
                  className="w-full h-full border-0"
                  title={`Preview of ${sweepstakes.title}`}
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
                {sweepstakes.landingPageUrl}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Share URL</label>
              <div className="text-sm text-muted-foreground break-all">
                {sweepstakes.shareUrl}
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
                {sweepstakes.title}
              </div>
              <div className="text-xs text-green-600">
                {sweepstakes.landingPageUrl}
              </div>
              <div className="text-sm text-gray-600">
                {sweepstakes.description}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}