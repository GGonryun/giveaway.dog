import { TaskActionProps } from '../../building-blocks';
import { useState, useEffect, useRef } from 'react';
import { WithProviderConnection } from '../provider-connection';
import { TiktokLikeTaskSchema } from '@/lib/task/schemas';
import { AlertCircle, Heart } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const EMBED_TIMEOUT = 5000;

export const TikTokLikeTaskActionForm: React.FC<
  TaskActionProps<TiktokLikeTaskSchema>
> = ({ onCancel, onSubmit, task, submission, isLoading }) => {
  const [embedHtml, setEmbedHtml] = useState<string | null>(null);
  const [isLoadingEmbed, setIsLoadingEmbed] = useState(true);
  const [embedError, setEmbedError] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const embedContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const embedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasValidUrl = task.postUrl && task.postUrl.trim().length > 0;

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

        // Check if this is a photo post
        const isPhotoPost = task.postUrl.includes('/photo/');

        if (isPhotoPost) {
          // For photo posts, create a simple embed since oEmbed doesn't support them well
          const photoId = task.postUrl.match(/\/photo\/(\d+)/)?.[1];
          const username = task.postUrl.match(/@([A-Za-z0-9_.]+)\//)?.[1];

          if (photoId && username) {
            // Create a manual blockquote embed similar to TikTok's format
            const manualEmbed = `
              <blockquote class="tiktok-embed" cite="${task.postUrl}" data-video-id="${photoId}">
                <section>
                  <a target="_blank" href="${task.postUrl}">@${username}</a>
                </section>
              </blockquote>
              <script async src="https://www.tiktok.com/embed.js"></script>
            `;
            setEmbedHtml(manualEmbed);
            setIsLoadingEmbed(false);
            return;
          }
        }

        // For video posts, use oEmbed API
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(task.postUrl)}`;
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
  }, [task.postUrl, hasValidUrl]);

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
      window.open(task.postUrl, '_blank', 'noopener');
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
        label: userInteracted ? 'Complete Task' : 'Like this post',
        icon: userInteracted ? undefined : Heart
      }}
      render={() => (
        <div className="space-y-4 w-full">
          {!hasValidUrl ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No TikTok post URL configured. Please set a valid TikTok post
                URL for this task.
              </AlertDescription>
            </Alert>
          ) : embedError ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to load TikTok embed. Please use the button below to
                view and like the post on TikTok.
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
                  Loading TikTok post...
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
