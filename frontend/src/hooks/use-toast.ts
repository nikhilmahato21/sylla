import { useState, useCallback } from "react";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

let toastFn: ((toast: Omit<Toast, "id">) => void) | null = null;

export function useToast() {
  const toast = useCallback((t: Omit<Toast, "id">) => {
    if (toastFn) toastFn(t);
  }, []);

  return { toast };
}

export function registerToastFn(fn: (toast: Omit<Toast, "id">) => void) {
  toastFn = fn;
}

export type { Toast };
