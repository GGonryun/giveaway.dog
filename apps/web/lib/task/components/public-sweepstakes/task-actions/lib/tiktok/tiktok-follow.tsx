import { TaskActionProps } from '../../building-blocks';
import { useState, useEffect, useRef } from 'react';
import { WithProviderConnection } from '../provider-connection';
import { TiktokFollowTaskSchema } from '@/lib/task/schemas';
import { AlertCircle, UserPlus, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const EMBED_TIMEOUT = 5000;

export const TikTokFollowTaskActionForm: React.FC<
  TaskActionProps<TiktokFollowTaskSchema>
> = ({ onCancel, onSubmit, task, submission, isLoading }) => {
  const [embedHtml, setEmbedHtml] = useState<string | null>(null);
  const [isLoadingEmbed, setIsLoadingEmbed] = useState(true);
  const [embedError, setEmbedError] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const embedContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const embedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

      embedTimeoutRef.current = setTimeout(() => {
        console.warn('TikTok embed timed out after 5 seconds');
        setEmbedError(true);
        setIsLoadingEmbed(false);
      }, EMBED_TIMEOUT);

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
          if (embedTimeoutRef.current) {
            clearTimeout(embedTimeoutRef.current);
          }
        };

        newScript.onerror = () => {
          console.error('Failed to load TikTok embed script');
          setEmbedError(true);
          if (embedTimeoutRef.current) {
            clearTimeout(embedTimeoutRef.current);
          }
        };
      }
    }

    return () => {
      if (embedTimeoutRef.current) {
        clearTimeout(embedTimeoutRef.current);
      }
    };
  }, [embedHtml]);

  const handleSubmit = () => {
    if (userInteracted) {
      onSubmit();
    } else {
      window.open(task.profileUrl, '_blank', 'noopener');
      setUserInteracted(true);
    }
  };

  return (
    <WithProviderConnection
      task={task}
      submission={submission}
      disabled={false}
      cancel={{
        className: 'hidden'
      }}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      submit={{
        label: userInteracted ? 'Complete Task' : 'Follow this profile',
        icon: userInteracted ? undefined : UserPlus
      }}
      render={() => (
        <div className="space-y-4  w-full">
          {!hasValidUrl ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No TikTok profile URL configured. Please set a valid TikTok
                profile URL for this task.
              </AlertDescription>
            </Alert>
          ) : embedError ? (
            <div className="space-y-3">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Unable to load TikTok embed. Please use the link below to view
                  and follow the profile on TikTok.
                </AlertDescription>
              </Alert>
              <Button variant="link" asChild className="underline">
                <Link
                  href={task.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open TikTok Profile
                </Link>
              </Button>
            </div>
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
