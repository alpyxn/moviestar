import React, { ReactNode, useEffect } from 'react';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollProps {
  // Function to call when more items should be loaded
  loadMore: () => Promise<void>;
  // Whether there are more items to load
  hasMore: boolean;
  // Whether the component is initially loading
  isLoading?: boolean;
  // Children to render
  children: ReactNode;
  // Optional className for the container
  className?: string;
  // Optional className for the loader
  loaderClassName?: string;
  // Custom loader component
  loader?: ReactNode;
  // End message when there are no more items
  endMessage?: ReactNode;
  // Whether to disable the infinite scroll
  disabled?: boolean;
  // Threshold in pixels before the bottom to trigger loading
  threshold?: number;
}

export const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  loadMore,
  hasMore,
  isLoading: externalLoading,
  children,
  className = '',
  loaderClassName = '',
  loader,
  endMessage,
  disabled = false,
  threshold = 200,
}) => {
  const {
    ref,
    isLoading,
    setIsLoading,
    setHasMore,
  } = useInfiniteScroll({
    threshold,
    disabled,
    initialLoading: externalLoading || false,
  });

  // Handle external loading state
  useEffect(() => {
    if (externalLoading !== undefined) {
      setIsLoading(externalLoading);
    }
  }, [externalLoading, setIsLoading]);

  // Update hasMore from props
  useEffect(() => {
    setHasMore(hasMore);
  }, [hasMore, setHasMore]);

  // Handle loadMore function with improved error handling
  useEffect(() => {
    const handleLoadMore = async () => {
      if (!isLoading && hasMore && !disabled) {
        setIsLoading(true);
        try {
          await loadMore();
        } catch (error) {
          console.error("Error loading more items:", error);
          // Set hasMore to false if loading fails
          setHasMore(false);
        } finally {
          setIsLoading(false);
        }
      }
    };

    // Add event listener to the ref element
    const currentRef = ref.current;
    if (currentRef) {
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting && hasMore && !isLoading && !disabled) {
            handleLoadMore();
          }
        },
        {
          rootMargin: `0px 0px ${threshold}px 0px`,
        }
      );

      observer.observe(currentRef);

      return () => {
        observer.disconnect();
      };
    }
  }, [ref, isLoading, hasMore, disabled, loadMore, setIsLoading, setHasMore, threshold]);

  return (
    <div className={className}>
      {children}
      
      <div ref={ref as React.RefObject<HTMLDivElement>}>
        {isLoading && (
          loader || (
            <div className={`flex justify-center items-center py-4 ${loaderClassName}`}>
              <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
              <span className="ml-2">Loading more...</span>
            </div>
          )
        )}
        
        {!isLoading && !hasMore && endMessage && (
          <div className="py-4 text-center text-gray-500">
            {endMessage}
          </div>
        )}
      </div>
    </div>
  );
};
