'use client';

import { useEffect, useRef, useState, useMemo, memo } from 'react';
import { useProcedureAsync } from '@/lib/mrpc/hook';
import getTwitterOEmbed from '@/lib/integrations/procedures/get-twitter-oembed';
import type { TwitterEmbedData } from '@/lib/integrations/procedures/get-twitter-oembed';
import { Loader2 } from 'lucide-react';

type TwitterEmbedProps = {
  postUrl: string;
  theme?: 'light' | 'dark';
};

const TwitterEmbedContent = memo(
  ({ html }: { html: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!containerRef.current) return;

      const timer = setTimeout(() => {
        if (typeof window !== 'undefined' && (window as any).twttr?.widgets) {
          (window as any).twttr.widgets.load(containerRef.current);
        }
      }, 100);

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

TwitterEmbedContent.displayName = 'TwitterEmbedContent';

export const TwitterEmbed: React.FC<TwitterEmbedProps> = ({
  postUrl,
  theme = 'dark'
}) => {
  const [embedData, setEmbedData] = useState<TwitterEmbedData | null>(null);
  const [embedError, setEmbedError] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  const { run: fetchTwitterEmbed, isLoading: isLoadingEmbed } =
    useProcedureAsync({
      action: getTwitterOEmbed
    });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setHasTimedOut(true);
    }, 5000);

    const fetchEmbed = async () => {
      try {
        const data = await fetchTwitterEmbed({
          postUrl,
          theme
        });
        clearTimeout(timeoutId);
        setEmbedData(data);
        setEmbedError(false);
        setHasTimedOut(false);
      } catch (err) {
        console.error('Failed to load Twitter embed:', err);
        clearTimeout(timeoutId);
        setEmbedError(true);
        setEmbedData(null);
      }
    };

    fetchEmbed();

    return () => clearTimeout(timeoutId);
  }, [postUrl, theme, fetchTwitterEmbed]);

  const content = useMemo(() => {
    if (isLoadingEmbed && !hasTimedOut) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (hasTimedOut && !embedData) {
      return (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">
            Click the button below to continue
          </p>
        </div>
      );
    }

    if (embedError || !embedData) {
      return null;
    }

    return <TwitterEmbedContent html={embedData.html} />;
  }, [isLoadingEmbed, embedError, embedData, hasTimedOut]);

  return content;
};
