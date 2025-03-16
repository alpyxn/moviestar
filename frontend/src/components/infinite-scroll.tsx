import React, { ReactNode, useEffect } from 'react';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollProps {
  loadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading?: boolean;
  children: ReactNode;
  className?: string;
  loaderClassName?: string;
  loader?: ReactNode;
  endMessage?: ReactNode;
  disabled?: boolean;
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

  useEffect(() => {
    if (externalLoading !== undefined) {
      setIsLoading(externalLoading);
    }
  }, [externalLoading, setIsLoading]);

  useEffect(() => {
    setHasMore(hasMore);
  }, [hasMore, setHasMore]);

  useEffect(() => {
    const handleLoadMore = async () => {
      if (!isLoading && hasMore && !disabled) {
        setIsLoading(true);
        try {
          await loadMore();
        } catch (error) {
          console.error("Error loading more items:", error);
          setHasMore(false);
        } finally {
          setIsLoading(false);
        }
      }
    };

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
