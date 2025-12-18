import { TaskActionProps } from '../../building-blocks';
import { useState, useEffect, useRef } from 'react';
import { WithProviderConnection } from '../provider-connection';
import { TiktokFollowTaskSchema } from '@/lib/task/schemas';
import { Progress } from '@/components/ui/progress';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const TIMER_DURATION = 10000;

export const TikTokFollowTaskActionForm: React.FC<
  TaskActionProps<TiktokFollowTaskSchema>
> = ({ onCancel, onSubmit, task, submission, isLoading }) => {
  const [embedHtml, setEmbedHtml] = useState<string | null>(null);
  const [isLoadingEmbed, setIsLoadingEmbed] = useState(true);
  const [embedError, setEmbedError] = useState(false);
  const [timerProgress, setTimerProgress] = useState(0);
  const [timerComplete, setTimerComplete] = useState(false);
  const embedContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const hasValidUrl = task.profileUrl && task.profileUrl.trim().length > 0;

  useEffect(() => {
    if (!hasValidUrl) {
      setIsLoadingEmbed(false);
      setEmbedError(true);
      return;
    }

    const fetchEmbed = async () => {
      try {
        setIsLoadingEmbed(true);
        setEmbedError(false);
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(task.profileUrl)}`;
        const response = await fetch(oembedUrl);

        if (!response.ok) {
          throw new Error('Failed to fetch TikTok embed');
        }

        const data = await response.json();
        setEmbedHtml(data.html);
      } catch (error) {
        console.error('Error fetching TikTok embed:', error);
        setEmbedHtml(null);
        setEmbedError(true);
      } finally {
        setIsLoadingEmbed(false);
      }
    };

    fetchEmbed();
  }, [task.profileUrl, hasValidUrl]);

  useEffect(() => {
    if (embedHtml && embedContainerRef.current && !scriptLoadedRef.current) {
      const container = embedContainerRef.current;
      container.innerHTML = embedHtml;

      const scriptTag = container.querySelector('script');
      if (scriptTag) {
        const newScript = document.createElement('script');
        newScript.src = scriptTag.src;
        newScript.async = true;
        document.body.appendChild(newScript);
        scriptLoadedRef.current = true;

        newScript.onload = () => {
          if (window.tiktokEmbed) {
            window.tiktokEmbed.lib.render(container);
          }
        };
      }
    }
  }, [embedHtml]);

  useEffect(() => {
    if (embedHtml && !isLoadingEmbed && !embedError) {
      startTimeRef.current = Date.now();

      const updateProgress = () => {
        if (!startTimeRef.current) return;

        const elapsed = Date.now() - startTimeRef.current;
        const progress = Math.min((elapsed / TIMER_DURATION) * 100, 100);

        setTimerProgress(progress);

        if (progress >= 100) {
          setTimerComplete(true);
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
        }
      };

      timerRef.current = setInterval(updateProgress, 100);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [embedHtml, isLoadingEmbed, embedError]);

  const remainingSeconds = Math.ceil(
    (TIMER_DURATION - (timerProgress / 100) * TIMER_DURATION) / 1000
  );

  return (
    <WithProviderConnection
      task={task}
      submission={submission}
      disabled={!timerComplete}
      onCancel={onCancel}
      onSubmit={onSubmit}
      isLoading={isLoading}
      render={() => (
        <div className="space-y-4  w-full">
          {!hasValidUrl || embedError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {!hasValidUrl
                  ? 'No TikTok profile URL configured. Please set a valid TikTok profile URL for this task.'
                  : 'Unable to load TikTok profile. Please verify the profile URL is correct.'}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {embedHtml && !isLoadingEmbed && (
                <div
                  ref={embedContainerRef}
                  className="tiktok-embed-container max-w-md mx-auto"
                />
              )}

              {isLoadingEmbed && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  Loading TikTok profile...
                </div>
              )}

              {!isLoadingEmbed && embedHtml && !submission && (
                <Progress value={timerProgress} />
              )}
            </>
          )}
        </div>
      )}
    />
  );
};

declare global {
  interface Window {
    tiktokEmbed?: {
      lib: {
        render: (container: HTMLElement) => void;
      };
    };
  }
}
