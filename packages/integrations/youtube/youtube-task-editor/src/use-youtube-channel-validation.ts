import { useState, useEffect, useRef } from 'react';
import { debounce } from '@giveaway/ui-utils/utils';
import verifyYouTubeChannel from './verify-youtube-channel';
import { ListChannelSnippetSchema } from '@giveaway/youtube-model/youtube';

type ValidationStatus = 'idle' | 'checking' | 'success' | 'error' | null;

type VerifyResult = Awaited<ReturnType<typeof verifyYouTubeChannel>>;

interface UseYouTubeChannelValidationOptions {
  channelUrl: string | undefined | null;
  debounceMs?: number;
  onError?: (error: string) => void;
  skipValidation?: boolean;
}

interface UseYouTubeChannelValidationReturn {
  status: ValidationStatus;
  snippet: ListChannelSnippetSchema | null;
  isValid: boolean;
}

export function useYouTubeChannelValidation({
  channelUrl,
  debounceMs = 500,
  onError,
  skipValidation = false
}: UseYouTubeChannelValidationOptions): UseYouTubeChannelValidationReturn {
  const [status, setStatus] = useState<ValidationStatus>(null);
  const [snippet, setSnippet] = useState<ListChannelSnippetSchema | null>(null);
  const pendingUrlRef = useRef<string | null>(null);

  const checkChannelRef = useRef(async (url: string) => {
    pendingUrlRef.current = url;

    let result: VerifyResult;
    try {
      result = await verifyYouTubeChannel({
        channelUrl: url
      });
    } catch {
      if (pendingUrlRef.current === url) {
        setStatus('error');
        onError?.(
          'Unable to verify YouTube channel. Please check if the channel exists or double check the URL.'
        );
      }
      return;
    }

    if (pendingUrlRef.current !== url) {
      return;
    }

    if (!result.ok) {
      setStatus('error');
      setSnippet(null);
      if (result.data.message) {
        onError?.(result.data.message);
      }
    } else {
      setStatus('success');
      setSnippet(result.data);
    }
  });

  const debouncedCheckChannelRef = useRef(
    debounce((url: string) => {
      setStatus('checking');
      checkChannelRef.current(url);
    }, debounceMs)
  );

  useEffect(() => {
    if (skipValidation) {
      setStatus(null);
      setSnippet(null);
      return;
    }

    if (!channelUrl) {
      setStatus('idle');
      setSnippet(null);
      return;
    }

    const debouncedCheckChannel = debouncedCheckChannelRef.current;
    debouncedCheckChannel(channelUrl);
    return debouncedCheckChannel.cancel;
  }, [channelUrl, skipValidation]);

  return {
    status,
    snippet,
    isValid: status === 'success'
  };
}
