'use client';

import { useEffect, useRef, useState, useMemo, memo } from 'react';
import { useProcedureAsync } from '@/lib/mrpc/hook';
import getBlueskyOEmbed from '@/lib/integrations/procedures/get-bluesky-oembed';
import type { BlueskyEmbedData } from '@/lib/integrations/procedures/get-bluesky-oembed';
import { Loader2 } from 'lucide-react';
import { BLUESKY_EMBED_SCRIPT_URL } from '@/lib/bluesky/embed';

type BlueskyEmbedProps = {
  postUrl: string;
};

const BlueskyEmbedContent = memo(
  ({ html }: { html: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!containerRef.current) return;

      const loadScript = () => {
        const existingScript = document.querySelector(
          `script[src="${BLUESKY_EMBED_SCRIPT_URL}"]`
        );

        if (!existingScript) {
          const script = document.createElement('script');
          script.src = BLUESKY_EMBED_SCRIPT_URL;
          script.async = true;
          document.body.appendChild(script);
        } else if (typeof (window as any).bluesky !== 'undefined') {
          (window as any).bluesky.scan();
        }
      };

      const timer = setTimeout(loadScript, 0);
      return () => clearTimeout(timer);
    }, [html]);

    return (
      <div ref={containerRef} className="w-full flex justify-center">
        <div
          dangerouslySetInnerHTML={{ __html: html }}
          className="wrapper [&_iframe]:w-full [&_iframe]:max-w-full [&_iframe]:h-auto [&_iframe]:mx-auto"
        />
      </div>
    );
  },
  (prevProps, nextProps) => prevProps.html === nextProps.html
);

BlueskyEmbedContent.displayName = 'BlueskyEmbedContent';

export const BlueskyEmbed: React.FC<BlueskyEmbedProps> = ({ postUrl }) => {
  const [embedData, setEmbedData] = useState<BlueskyEmbedData | null>(null);
  const [embedError, setEmbedError] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  const { run: fetchBlueskyEmbed, isLoading: isLoadingEmbed } =
    useProcedureAsync({
      action: getBlueskyOEmbed
    });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setHasTimedOut(true);
    }, 5000);

    const fetchEmbed = async () => {
      try {
        const data = await fetchBlueskyEmbed({ postUrl });
        clearTimeout(timeoutId);
        setEmbedData(data);
        setEmbedError(false);
        setHasTimedOut(false);
      } catch (err) {
        console.error('Failed to load Bluesky embed:', err);
        clearTimeout(timeoutId);
        setEmbedError(true);
        setEmbedData(null);
      }
    };

    fetchEmbed();

    return () => clearTimeout(timeoutId);
  }, [postUrl, fetchBlueskyEmbed]);

  const content = useMemo(() => {
    if (isLoadingEmbed && !hasTimedOut) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (embedError || (hasTimedOut && !embedData)) {
      return (
        <div className="flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Unable to load post preview. Click the button below to view and like
            the post on Bluesky.
          </p>
        </div>
      );
    }

    if (!embedData) {
      return null;
    }

    return <BlueskyEmbedContent html={embedData.html} />;
  }, [isLoadingEmbed, embedError, embedData, hasTimedOut]);

  return content;
};
