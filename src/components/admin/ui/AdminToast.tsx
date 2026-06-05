import { CheckCircle2 } from "lucide-react";

interface AdminToastProps {
  message: string;
}

export function AdminToast({ message }: AdminToastProps) {
  return (
    <div className="admin-toast" role="status">
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}
