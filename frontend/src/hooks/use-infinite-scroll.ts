import { useState, useEffect, useRef, useCallback } from 'react';

interface InfiniteScrollOptions {
  // Threshold in pixels before the bottom to trigger loading
  threshold?: number;
  // Initial loading state
  initialLoading?: boolean;
  // Whether to disable the infinite scroll
  disabled?: boolean;
}

interface InfiniteScrollResult {
  // Reference to attach to the scrollable element
  ref: React.RefObject<HTMLElement>;
  // Whether more items are being loaded
  isLoading: boolean;
  // Set loading state manually
  setIsLoading: (loading: boolean) => void;
  // Whether the end of the list has been reached
  hasMore: boolean;
  // Set whether there are more items to load
  setHasMore: (hasMore: boolean) => void;
  // Manually trigger the next load
  loadMore: () => void;
  // Reset the infinite scroll
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

  // Store the loadMore function in a ref so we can call it
  // from the intersection observer callback
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore && !disabled) {
      loadMoreFnRef.current?.();
    }
  }, [isLoading, hasMore, disabled]);

  useEffect(() => {
    loadMoreFnRef.current = loadMore;
  }, [loadMore]);

  // Setup the intersection observer to detect when the user
  // has scrolled near the bottom of the content
  useEffect(() => {
    if (disabled) return;

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !isLoading) {
        loadMore();
      }
    };

    // Cleanup old observer if it exists
    if (observer.current) {
      observer.current.disconnect();
    }

    // Create a new observer
    observer.current = new IntersectionObserver(handleObserver, {
      rootMargin: `0px 0px ${threshold}px 0px`,
    });

    // Observe the loader element if it exists
    const currentRef = scrollRef.current;
    if (currentRef) {
      observer.current.observe(currentRef);
    }

    // Cleanup function
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [threshold, isLoading, hasMore, disabled, loadMore]);

  // Reset function to reset the state of the infinite scroll
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
