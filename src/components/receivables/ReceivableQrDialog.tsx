import { useEffect } from "react";
import { Loader2, QrCode, XCircle } from "lucide-react";
import { formatCurrency } from "@/data/mockData";

interface Props {
  open: boolean;
  amount: number;
  expirationDate: string;
  qrImageBase64: string;
  expired: boolean;
  checking: boolean;
  cancelling: boolean;
  onClose: () => void;
  onVerify: () => void;
  onCancelQr: () => void;
}

export function ReceivableQrDialog({
  open,
  amount,
  expirationDate,
  qrImageBase64,
  expired,
  checking,
  cancelling,
  onClose,
  onVerify,
  onCancelQr,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !checking && !cancelling) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, checking, cancelling, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40"
        onClick={() => !checking && !cancelling && onClose()}
        aria-label="Cerrar"
      />
      <div className="relative w-full max-w-md rounded-xl border border-stone-200 bg-white shadow-xl p-5 space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-stone-900">Cobrar con QR</h2>
          <p className="text-2xl font-extrabold text-green-800 tabular-nums">{formatCurrency(amount)}</p>
          <p className="text-xs text-stone-600">
            Vence: {new Date(expirationDate).toLocaleDateString("es-BO")}
          </p>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-4 flex justify-center">
          {qrImageBase64 ? (
            <img
              src={`data:image/png;base64,${qrImageBase64}`}
              alt="Código QR de pago"
              className="w-64 h-64 object-contain"
            />
          ) : (
            <div className="w-64 h-64 flex items-center justify-center text-stone-500">
              <QrCode className="w-10 h-10" />
            </div>
          )}
        </div>

        {expired && (
          <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Este QR expiró. Genera uno nuevo.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancelQr}
            disabled={cancelling || checking}
            className="px-4 py-2 text-xs font-bold border border-stone-200 rounded-lg text-stone-700 hover:bg-stone-50 disabled:opacity-50"
          >
            {cancelling ? "Cancelando…" : "Cancelar QR"}
          </button>
          <button
            type="button"
            onClick={onVerify}
            disabled={checking || cancelling || expired}
            className="inline-flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-green-800 rounded-lg hover:bg-green-900 disabled:opacity-50"
          >
            {checking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Verificar pago
          </button>
        </div>
      </div>
    </div>
  );
}
