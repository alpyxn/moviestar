import { toast as sonnerToast } from "sonner";
import { useCallback } from "react";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  action?: React.ReactNode;
};

export function useToast() {
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
  }, []);

  return {
    toast,
  };
}

export { sonnerToast as toast };
