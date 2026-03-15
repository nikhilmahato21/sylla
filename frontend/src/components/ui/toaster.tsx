import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { registerToastFn, Toast } from "@/hooks/use-toast";

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    registerToastFn((t) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 4000);
    });
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg ${
              toast.variant === "destructive"
                ? "bg-destructive/10 border-destructive/20"
                : "bg-card border-border"
            }`}
          >
            {toast.variant === "destructive" ? (
              <AlertCircle size={15} className="text-destructive mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 size={15} className="text-primary mt-0.5 shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                toast.variant === "destructive" ? "text-destructive" : "text-foreground"
              }`}>
                {toast.title}
              </p>
              {toast.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X size={13} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
