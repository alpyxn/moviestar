import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonProps, Button } from "@/components/ui/button";

interface PaginationProps {
  className?: string;
  totalItems: number;
  currentPage: number;
  pageSize: number;
  siblingCount?: number;
  onPageChange: (page: number) => void;
}

interface PaginationButtonProps extends ButtonProps {
  page: number | string | React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onPageChange?: (page: number) => void;
}

const PaginationButton: React.FC<PaginationButtonProps> = ({
  page,
  active,
  disabled,
  onPageChange,
  className,
  ...props
}) => {
  const isNumber = typeof page === "number";
  
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="icon"
      className={cn(
        "h-9 w-9",
        {
          "bg-rose-600 hover:bg-rose-700": active,
          "pointer-events-none opacity-50": disabled,
        },
        className
      )}
      disabled={disabled}
      onClick={() => {
        if (isNumber && onPageChange) {
          onPageChange(page as number);
        }
      }}
      {...props}
    >
      {page}
    </Button>
  );
};

export function Pagination({
  className,
  totalItems,
  currentPage,
  pageSize,
  siblingCount = 1,
  onPageChange,
}: PaginationProps) {
  // Calculate total pages
  const totalPages = Math.ceil(totalItems / pageSize);

  // Create a range array helper function
  const range = (start: number, end: number) => {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // Generate pagination items
  const generatePaginationItems = () => {
    // If there are fewer than 7 pages, just show all
    if (totalPages <= 7) {
      return range(1, totalPages);
    }

    // Determine the start and end of the sibling range
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    // Determine if we should show ellipsis
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    // Always include first and last page
    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    // Cases for different dot patterns
    if (!shouldShowLeftDots && shouldShowRightDots) {
      // Show no dots on left, dots on right
      const leftRange = range(1, 5);
      return [...leftRange, "right-dots", totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      // Show dots on left, no dots on right
      const rightRange = range(totalPages - 4, totalPages);
      return [firstPageIndex, "left-dots", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      // Show dots on both sides
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [firstPageIndex, "left-dots", ...middleRange, "right-dots", lastPageIndex];
    }
  };

  const paginationItems = generatePaginationItems();

  // Don't render if there's only one page or no items
  if (totalPages <= 1) return null;

  return (
    <nav
      className={cn("flex items-center justify-center gap-1", className)}
      aria-label="Pagination"
    >
      <PaginationButton
        page={<ChevronLeft className="h-4 w-4" />}
        disabled={currentPage <= 1}
        onPageChange={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
      />
      
      {paginationItems?.map((item, index) => {
        if (item === "left-dots" || item === "right-dots") {
          return (
            <Button
              key={`${item}-${index}`}
              variant="outline"
              size="icon"
              className="h-9 w-9 cursor-default"
              disabled
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          );
        }

        return (
          <PaginationButton
            key={`page-${item}`}
            page={item as number}
            active={currentPage === item}
            onPageChange={onPageChange}
            aria-label={`Page ${item}`}
            aria-current={currentPage === item ? "page" : undefined}
          />
        );
      })}
      
      <PaginationButton
        page={<ChevronRight className="h-4 w-4" />}
        disabled={currentPage >= totalPages}
        onPageChange={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
      />
    </nav>
  );
}
