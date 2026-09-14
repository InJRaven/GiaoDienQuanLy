import { useEffect, useMemo, useRef, useState } from 'react';

export interface UseMinDelayOptions {
  /**
   * Minimum duration in ms for initial full-page/tab skeleton load.
   * Default: 800ms (satisfies the requested 0.5s - 1.0s range).
   */
  initialDelay?: number;
  /**
   * Minimum duration in ms for subsequent search/filter/refetch skeleton rows.
   * Default: 650ms (satisfies the requested >= 0.5s).
   */
  subsequentDelay?: number;
}

export interface UseMinDelayParams {
  isLoading: boolean;
  isFetching: boolean;
  hasData: boolean;
  triggerKey?: any;
  options?: UseMinDelayOptions;
}

/**
 * Hook to enforce a minimum visible duration for skeleton loaders.
 * Prevents instant UI flickering when backend or cached responses resolve quickly.
 */
export function useMinDelay({
  isLoading,
  isFetching,
  hasData,
  triggerKey,
  options,
}: UseMinDelayParams) {
  const initialDelay = options?.initialDelay ?? 800;
  const subsequentDelay = options?.subsequentDelay ?? 650;

  // 1. Initial Load Minimum Delay (0.5s - 1.0s)
  const [initialDelayDone, setInitialDelayDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialDelayDone(true);
    }, initialDelay);
    return () => clearTimeout(timer);
  }, [initialDelay]);

  // Show full-page skeleton while initial minimum timer is active OR initial query is still loading without data
  const showInitialSkeleton = !initialDelayDone || (isLoading && !hasData);

  // 2. Subsequent Searches / Filter Changes / Refetch Minimum Delay (>= 0.5s)
  const [isSubsequentDelaying, setIsSubsequentDelaying] = useState(false);
  const subsequentTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fetchStartTimeRef = useRef<number>(0);
  const isInitialDoneRef = useRef(false);

  const serializedTriggerKey = useMemo(() => {
    if (triggerKey === undefined || triggerKey === null) return '';
    return typeof triggerKey === 'object' ? JSON.stringify(triggerKey) : String(triggerKey);
  }, [triggerKey]);

  const prevTriggerKeyRef = useRef<string>(serializedTriggerKey);

  useEffect(() => {
    if (!showInitialSkeleton) {
      isInitialDoneRef.current = true;
    }
  }, [showInitialSkeleton]);

  useEffect(() => {
    if (!isInitialDoneRef.current) return;

    const triggerChanged = prevTriggerKeyRef.current !== serializedTriggerKey;
    prevTriggerKeyRef.current = serializedTriggerKey;

    if (isFetching || triggerChanged) {
      fetchStartTimeRef.current = Date.now();
      setIsSubsequentDelaying(true);

      if (subsequentTimerRef.current) {
        clearTimeout(subsequentTimerRef.current);
        subsequentTimerRef.current = null;
      }
    } else if (!isFetching && isSubsequentDelaying) {
      const elapsed = Date.now() - fetchStartTimeRef.current;
      const remaining = Math.max(0, subsequentDelay - elapsed);

      if (remaining === 0) {
        setIsSubsequentDelaying(false);
      } else {
        subsequentTimerRef.current = setTimeout(() => {
          setIsSubsequentDelaying(false);
        }, remaining);
      }
    }

    return () => {
      if (subsequentTimerRef.current) {
        clearTimeout(subsequentTimerRef.current);
      }
    };
  }, [isFetching, serializedTriggerKey, subsequentDelay, isSubsequentDelaying]);

  const isTableLoading = !showInitialSkeleton && (isFetching || isSubsequentDelaying);

  return {
    showInitialSkeleton,
    isTableLoading,
  };
}
