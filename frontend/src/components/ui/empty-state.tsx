import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
        <Icon size={20} className="text-muted-foreground/50" />
      </div>
      <p className="font-medium text-foreground mb-1">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs font-mono">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
