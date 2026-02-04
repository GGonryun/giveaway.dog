'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, AlertCircle, AlarmClock } from 'lucide-react';
import { PickerStatus } from '@prisma/client';
import { TwitterScrapeProgress } from '../schemas/workflow';
import { cn } from '@/lib/utils';

interface TwitterScrapeProgressMonitorProps {
  pickerId: string;
  runId: string | null;
  status: PickerStatus;
}

export const TwitterScrapeProgressMonitor: React.FC<
  TwitterScrapeProgressMonitorProps
> = ({ runId, status }) => {
  const router = useRouter();
  const [progress, setProgress] = useState<TwitterScrapeProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const isConnectingRef = useRef(false);

  const shouldMonitor =
    status === 'CREATED' ||
    status === 'PROCESSING' ||
    status === 'SCHEDULED' ||
    status === 'DRAFT';

  useEffect(() => {
    if (shouldMonitor && !runId) {
      const intervalId = setInterval(() => {
        router.refresh();
      }, 5000);

      return () => clearInterval(intervalId);
    }
  }, [shouldMonitor, runId, router]);

  const connectToStream = useCallback(async () => {
    if (!shouldMonitor || !runId || isConnectingRef.current) {
      return;
    }

    isConnectingRef.current = true;

    try {
      const response = await fetch(
        `/api/workflows/twitter/scrape/resume?runId=${runId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'text/plain'
          }
        }
      );

      if (response.status === 202) {
        const data = await response.json();
        if (data.status === 'complete') {
          setIsComplete(true);
          router.refresh();
        } else if (data.status === 'failed') {
          setError(`Workflow failed: ${data.reason || 'Unknown error'}`);
        }
        return;
      }

      if (!response.ok) {
        throw new Error(
          `Failed to connect to progress stream: ${response.statusText}`
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let streamComplete = false;

      while (!streamComplete) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line) as TwitterScrapeProgress;
            setProgress(data);

            if (data.status === 'COMPLETE') {
              streamComplete = true;
              setIsComplete(true);
              setTimeout(() => {
                router.refresh();
              }, 1000);
              break;
            }
          } catch (parseError) {
            console.error('Failed to parse progress update:', parseError);
          }
        }
      }
    } catch (err) {
      console.error('Error connecting to progress stream:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      isConnectingRef.current = false;
    }
  }, [runId, shouldMonitor, router]);

  useEffect(() => {
    if (shouldMonitor && !isComplete && runId) {
      connectToStream();
    }
  }, [shouldMonitor, isComplete, runId, connectToStream]);

  if (!shouldMonitor) {
    return null;
  }

  if (shouldMonitor && !runId) {
    return (
      <Card className="border-yellow-500/50 bg-yellow-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            Initializing Draw
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Starting up the draw process... This will begin processing shortly.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500/50 bg-red-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Progress Monitoring Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (isComplete) {
    return (
      <Card className="border-green-500/50 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            Processing Complete
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            All entries have been processed successfully.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        progress
          ? 'border-blue-500/50 bg-blue-500/5'
          : 'border-gray-500/50 bg-gray-500/5'
      )}
    >
      <CardHeader>
        <CardTitle
          className={cn(
            'flex items-center gap-2',
            progress ? 'text-blue-600' : 'text-gray-600'
          )}
        >
          {progress ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <AlarmClock className="size-4" />
          )}
          {progress ? 'Processing Entries' : 'Scheduled for Processing'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {progress ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {progress.current.toLocaleString()}
                  {progress.max ? ` / ${progress.max.toLocaleString()}` : ''}
                </span>
              </div>
              <Progress value={progress.progress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{progress.progress}% complete</span>
                <span className="text-blue-600 font-medium">
                  {progress.status}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Picker is scheduled to be processed at a later time...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
