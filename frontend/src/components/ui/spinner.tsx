import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const sizeMap = { sm: "w-4 h-4 border-[1.5px]", md: "w-6 h-6 border-2", lg: "w-8 h-8 border-2" };
  return (
    <div
      className={cn(
        "rounded-full border-primary border-t-transparent animate-spin",
        sizeMap[size],
        className
      )}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="font-mono text-xs text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
