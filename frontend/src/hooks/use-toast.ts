// This is a wrapper around sonner to maintain API compatibility with the old toast system
import { toast as sonnerToast } from "sonner";
import { useCallback } from "react";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
};

export function useToast() {
  // Use useCallback to memoize the toast function to prevent unnecessary re-renders
  const toast = useCallback(({ title, description, variant, action }: ToastProps) => {
    if (variant === "destructive") {
      return sonnerToast.error(title, {
        description,
        action
      });
    }
    
    return sonnerToast(title || "", {
      description,
      action
    });
  }, []); // Empty dependency array means this function will only be created once

  return {
    toast,
  };
}

// Export the sonner toast directly for more advanced use cases
export { sonnerToast as toast };
