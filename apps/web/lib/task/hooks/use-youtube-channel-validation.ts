import { useState, useEffect, useRef } from 'react';
import { debounce } from '@giveaway/ui-utils/utils';
import verifyYouTubeChannel from '@/procedures/sweepstakes/verify-youtube-channel';
import { ListChannelSnippetSchema } from '@giveaway/youtube-model/youtube';

type ValidationStatus = 'idle' | 'checking' | 'success' | 'error' | null;

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
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingUrlRef = useRef<string>('');

  const checkChannelRef = useRef(async (url: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    pendingUrlRef.current = url;
    abortControllerRef.current = new AbortController();

    try {
      const result = await verifyYouTubeChannel({
        channelUrl: url
      });

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
    } catch (error) {
      if (pendingUrlRef.current === url) {
        setStatus('error');
        onError?.(
          'Unable to verify YouTube channel. Please check if the channel exists or double check the URL.'
        );
      }
    }
  });

  const debouncedCheckChannelRef = useRef(
    debounce((url: string) => {
      if (!url) {
        setStatus('idle');
        setSnippet(null);
        return;
      }

      setStatus('checking');
      checkChannelRef.current(url);
    }, debounceMs)
  );

  useEffect(() => {
    if (skipValidation) {
      setStatus(null);
      setSnippet(null);
      debouncedCheckChannelRef.current.cancel();
      return;
    }

    if (!channelUrl) {
      setStatus('idle');
      setSnippet(null);
      debouncedCheckChannelRef.current.cancel();
      return;
    }

    debouncedCheckChannelRef.current(channelUrl);
  }, [channelUrl, skipValidation]);

  useEffect(() => {
    return () => {
      debouncedCheckChannelRef.current.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    status,
    snippet,
    isValid: status === 'success'
  };
}
