import { useState, useEffect, useRef, useCallback } from 'react';

interface InfiniteScrollOptions {
  threshold?: number;
  initialLoading?: boolean;
  disabled?: boolean;
}

interface InfiniteScrollResult {
  ref: React.RefObject<HTMLElement>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  hasMore: boolean;
  setHasMore: (hasMore: boolean) => void;
  loadMore: () => void;
  reset: () => void;
}

export function useInfiniteScroll({
  threshold = 200,
  initialLoading = false,
  disabled = false,
}: InfiniteScrollOptions = {}): InfiniteScrollResult {
  const [isLoading, setIsLoading] = useState<boolean>(initialLoading);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const scrollRef = useRef<HTMLElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreFnRef = useRef<(() => void) | null>(null);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore && !disabled) {
      loadMoreFnRef.current?.();
    }
  }, [isLoading, hasMore, disabled]);

  useEffect(() => {
    loadMoreFnRef.current = loadMore;
  }, [loadMore]);

  useEffect(() => {
    if (disabled) return;

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !isLoading) {
        loadMore();
      }
    };

    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(handleObserver, {
      rootMargin: `0px 0px ${threshold}px 0px`,
    });

    const currentRef = scrollRef.current;
    if (currentRef) {
      observer.current.observe(currentRef);
    }

    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [threshold, isLoading, hasMore, disabled, loadMore]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setHasMore(true);
  }, []);

  return {
    ref: scrollRef,
    isLoading,
    setIsLoading,
    hasMore,
    setHasMore,
    loadMore,
    reset,
  };
}
