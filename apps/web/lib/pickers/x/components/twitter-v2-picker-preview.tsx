'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { TwitterV2PickerFormSchema } from '@giveaway/x-picker-model/schemas/form';
import { useEffect, useState, memo } from 'react';
import { Loader2, AlertCircle, LucideIcon } from 'lucide-react';
import type { TwitterEmbedData } from '@/lib/integrations/procedures/get-twitter-oembed';
import { Card, CardContent } from '@giveaway/ui-primitives/card';
import { useProcedureAsync } from '@giveaway/rpc-client/hook';
import getTwitterOEmbed from '@/lib/integrations/procedures/get-twitter-oembed';
import { xStatusRefineUrl } from '@giveaway/x-model/twitter';
import { FailureData } from '@giveaway/rpc-model/types';
import { SocialXIcon } from '@giveaway/integration-icons/x-icon';
import { cn } from '@giveaway/ui-utils/utils';
import { useTheme } from 'next-themes';

interface CachedTwitterEmbed {
  data: TwitterEmbedData;
  timestamp: number;
}

const CACHE_TTL = 15 * 60 * 1000;
const CACHE_PREFIX = 'twitter_embed_v2_';

function getCachedEmbed(url: string): TwitterEmbedData | null {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + url);
    if (!cached) return null;

    const { data, timestamp }: CachedTwitterEmbed = JSON.parse(cached);
    const now = Date.now();

    if (now - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_PREFIX + url);
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

function setCachedEmbed(url: string, data: TwitterEmbedData): void {
  try {
    const cached: CachedTwitterEmbed = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_PREFIX + url, JSON.stringify(cached));
  } catch {
    // Ignore localStorage errors
  }
}

interface TwitterV2PreviewProps {
  postUrl?: string;
  hasError?: boolean;
  className?: string;
}

interface PreviewStateCardProps {
  icon?: LucideIcon;
  title?: string;
  description: string;
  code?: string;
}

const PreviewStateCard = ({
  icon: Icon,
  title,
  description,
  code
}: PreviewStateCardProps) => (
  <Card className="max-w-md mx-auto">
    <CardContent className="pt-6">
      <div className="flex flex-col items-center justify-center py-6 gap-3">
        {Icon && <Icon className="h-10 w-10 text-muted-foreground" />}
        <div className="text-center">
          {title && <p className="text-sm font-medium mb-1">{title}</p>}
          <p className="text-xs text-muted-foreground max-w-sm">
            {description}
            {code && (
              <>
                <br />
                <code className="text-xs bg-muted px-2 py-1 rounded mt-1 inline-block">
                  {code}
                </code>
              </>
            )}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const TwitterV2EmbedItemInternal = ({
  postUrl,
  hasError
}: {
  postUrl: string;
  hasError?: boolean;
}) => {
  const [embedData, setEmbedData] = useState<TwitterEmbedData | null>(null);
  const [error, setError] = useState<FailureData | null>(null);
  const { theme } = useTheme();
  const { run: fetchTwitterEmbed, isLoading } = useProcedureAsync({
    action: getTwitterOEmbed
  });

  useEffect(() => {
    if (!postUrl || typeof postUrl !== 'string' || hasError) {
      setEmbedData(null);
      setError(null);
      return;
    }

    if (!xStatusRefineUrl(postUrl)) {
      setEmbedData(null);
      setError(null);
      return;
    }

    const fetchEmbed = async () => {
      const cached = getCachedEmbed(postUrl);
      if (cached) {
        setEmbedData(cached);
        return;
      }

      setError(null);

      try {
        const data = await fetchTwitterEmbed({
          postUrl,
          theme: theme === 'light' ? 'light' : 'dark'
        });
        setEmbedData(data);
        setCachedEmbed(postUrl, data);
      } catch (err: any) {
        console.error(err);
        setError(err);
        setEmbedData(null);
      }
    };

    const debounceTimer = setTimeout(fetchEmbed, 500);
    return () => clearTimeout(debounceTimer);
  }, [postUrl, hasError, fetchTwitterEmbed, theme]);

  useEffect(() => {
    if (!embedData) return;

    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).twttr?.widgets) {
        (window as any).twttr.widgets.load();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [embedData]);

  return (
    <>
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <PreviewStateCard
          icon={AlertCircle}
          title="Unable to Load Tweet"
          description={error.message}
          code={`CODE: ${error.code}`}
        />
      )}

      {postUrl && hasError && !isLoading && (
        <PreviewStateCard
          icon={AlertCircle}
          title="Invalid Post URL"
          description="Please enter a valid Twitter/X post URL in the format:"
          code="https://x.com/username/status/123456"
        />
      )}

      {embedData && !isLoading && (
        <div
          dangerouslySetInnerHTML={{ __html: embedData.html }}
          className="wrapper"
        />
      )}
    </>
  );
};

const TwitterV2EmbedItem = memo(TwitterV2EmbedItemInternal);

const TwitterV2PreviewInternal = ({
  postUrl,
  hasError,
  className
}: TwitterV2PreviewProps) => {
  return (
    <div className={cn('flex grow overflow-y-auto bg-primary/5', className)}>
      <div className="flex flex-col items-center min-h-full w-full">
        <div className="w-full max-w-xl my-auto">
          {!postUrl ? (
            <PreviewStateCard
              icon={SocialXIcon}
              description="Enter a post URL to see a preview"
              code="https://x.com/username/status/123456"
            />
          ) : (
            <TwitterV2EmbedItem postUrl={postUrl} hasError={hasError} />
          )}
        </div>
      </div>
    </div>
  );
};

const TwitterV2Preview = memo(TwitterV2PreviewInternal);

export const TwitterV2PickerPreviewEmbed: React.FC<{
  postUrl: string;
  className?: string;
}> = ({ postUrl, className }) => {
  return <TwitterV2Preview postUrl={postUrl} className={className} />;
};

export const TwitterV2PickerPreview: React.FC<{ className?: string }> = ({
  className
}) => {
  const { control, getFieldState } =
    useFormContext<TwitterV2PickerFormSchema>();
  const postUrls = useWatch({ control, name: 'setup.postUrls' });

  const activeUrls = postUrls
    .map((item, index) => ({
      url: item.url,
      hasError: !!getFieldState(`setup.postUrls.${index}.url`).error,
      index
    }))
    .filter(({ url, hasError }) => url || hasError);

  return (
    <div className={cn('flex grow overflow-y-auto bg-primary/5', className)}>
      <div className="flex flex-col items-center min-h-full w-full">
        {activeUrls.length === 0 ? (
          <div className="w-full max-w-xl my-auto">
            <PreviewStateCard
              icon={SocialXIcon}
              description="Enter a post URL to see a preview"
              code="https://x.com/username/status/123456"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-6 w-full max-w-xl my-auto">
            {activeUrls.map(({ url, hasError, index }) => (
              <TwitterV2EmbedItem
                key={index}
                postUrl={url}
                hasError={hasError}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
