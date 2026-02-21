import { useState, useEffect, useRef } from 'react';
import { debounce } from '@/lib/utils';
import verifyTwitchTrigger from '@/procedures/sweepstakes/verify-twitch-trigger';

type ValidationStatus = 'idle' | 'checking' | 'available' | 'conflict' | null;

interface UseTwitchTriggerValidationOptions {
  trigger: string | undefined | null;
  sweepstakesId?: string;
  taskId?: string;
  teamId: string;
  debounceMs?: number;
  onConflict?: (sweepstakesName: string) => void;
  skipValidation?: boolean;
}

interface ConflictInfo {
  sweepstakesId: string;
  sweepstakesName: string;
}

interface UseTwitchTriggerValidationReturn {
  status: ValidationStatus;
  conflict: ConflictInfo | null;
  isAvailable: boolean;
}

export function useTwitchTriggerValidation({
  trigger,
  sweepstakesId,
  taskId,
  teamId,
  debounceMs = 500,
  onConflict,
  skipValidation = false
}: UseTwitchTriggerValidationOptions): UseTwitchTriggerValidationReturn {
  const [status, setStatus] = useState<ValidationStatus>(null);
  const [conflict, setConflict] = useState<ConflictInfo | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingTriggerRef = useRef<string>('');

  const checkTriggerRef = useRef(async (triggerValue: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    pendingTriggerRef.current = triggerValue;
    abortControllerRef.current = new AbortController();

    try {
      const result = await verifyTwitchTrigger({
        trigger: triggerValue,
        sweepstakesId,
        taskId,
        teamId
      });

      if (pendingTriggerRef.current !== triggerValue) {
        return;
      }

      if (!result.ok) {
        setStatus('idle');
        setConflict(null);
        return;
      }

      if (result.data.available) {
        setStatus('available');
        setConflict(null);
      } else {
        setStatus('conflict');
        const conflictInfo: ConflictInfo = {
          sweepstakesId: result.data.conflictingSweepstakesId!,
          sweepstakesName: result.data.conflictingSweepstakesName!
        };
        setConflict(conflictInfo);
        onConflict?.(result.data.conflictingSweepstakesName!);
      }
    } catch (error) {
      if (pendingTriggerRef.current === triggerValue) {
        setStatus('idle');
        setConflict(null);
      }
    }
  });

  const debouncedCheckTriggerRef = useRef(
    debounce((triggerValue: string) => {
      if (!triggerValue) {
        setStatus('idle');
        setConflict(null);
        return;
      }

      setStatus('checking');
      checkTriggerRef.current(triggerValue);
    }, debounceMs)
  );

  useEffect(() => {
    if (skipValidation) {
      setStatus(null);
      setConflict(null);
      debouncedCheckTriggerRef.current.cancel();
      return;
    }

    if (!trigger) {
      setStatus('idle');
      setConflict(null);
      debouncedCheckTriggerRef.current.cancel();
      return;
    }

    debouncedCheckTriggerRef.current(trigger);
  }, [trigger, sweepstakesId, taskId, skipValidation]);

  useEffect(() => {
    return () => {
      debouncedCheckTriggerRef.current.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    status,
    conflict,
    isAvailable: status === 'available'
  };
}
