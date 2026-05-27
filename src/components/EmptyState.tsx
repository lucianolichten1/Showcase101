import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-stone-400">
      <Icon size={32} strokeWidth={1.5} />
      <p className="text-sm font-medium text-stone-600">{title}</p>
      {description && (
        <p className="text-xs text-stone-400 text-center max-w-xs leading-relaxed">{description}</p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-2 px-4 py-1.5 rounded-lg bg-stone-800 text-white text-xs font-bold hover:bg-stone-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
