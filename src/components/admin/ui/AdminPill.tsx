import type { AdminPillTone } from "@/domains/admin/displayModel";

interface AdminPillProps {
  tone: AdminPillTone;
  label: string;
  showDot?: boolean;
}

export function AdminPill({ tone, label, showDot = true }: AdminPillProps) {
  return (
    <span className={`admin-pill ${tone}`}>
      {showDot && <span className={`admin-dot ${tone}`} />}
      {label}
    </span>
  );
}
