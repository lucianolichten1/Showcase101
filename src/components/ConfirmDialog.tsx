import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  loading = false,
  onConfirm,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40"
        aria-label="Cerrar"
        onClick={() => !loading && onClose()}
      />
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl border border-stone-200 shadow-xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 id="confirm-dialog-title" className="text-sm font-bold text-stone-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="px-5 py-4 text-sm text-stone-700">{message}</p>
        <div className="flex justify-end gap-2 border-t border-stone-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "px-4 py-2 text-xs font-bold text-white rounded-lg disabled:opacity-50",
              destructive ? "bg-red-700 hover:bg-red-800" : "bg-green-800 hover:bg-green-900"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
